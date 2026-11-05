import mongoose from "mongoose";
import { isDeepStrictEqual } from "node:util";
import Cart from "../models/Cart";
import Order from "../models/Order";
import Product from "../models/Product";
import AppError from "../utils/AppError";
import { IAddress, IOrder } from "../types";

export type OrderStatus = IOrder["status"];
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
interface CheckoutBuyer {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: IAddress;
}
const transactionOptions = {
  readConcern: { level: "snapshot" as const },
  writeConcern: { w: "majority" as const },
  readPreference: "primary" as const,
};

// Required uniqueness must cover every cart/order, including deployment with
// autoIndex disabled. Never accept an index that only covers some statuses.
async function requireCheckoutIndexes() {
  await Cart.init();
  await Order.init();
  for (const [collection, field] of [[Cart.collection, "buyer"], [Order.collection, "orderNumber"]] as const) {
    const indexes = await collection.listIndexes().toArray();
    if (!indexes.some(index => index.unique === true && !index.sparse &&
      index.partialFilterExpression === undefined && index.expireAfterSeconds === undefined &&
      (!index.collation || index.collation.locale === "simple") &&
      isDeepStrictEqual(Object.entries(index.key), [[field, 1]]))) {
      throw new AppError("Required checkout indexes are missing or incompatible. Prepare order storage before accepting orders.", 503);
    }
  }
}

export async function checkoutCart(buyer: CheckoutBuyer, notes = "", reviewedVersion?: number) {
  if (reviewedVersion !== undefined && (!Number.isSafeInteger(reviewedVersion) || reviewedVersion < 0)) {
    throw new AppError("Invalid cart version. Please refresh your cart.", 400);
  }
  if (typeof notes !== "string") throw new AppError("Order notes must be text.", 400);
  await requireCheckoutIndexes();
  let expectedVersion = reviewedVersion;
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const cart = await Cart.findOne({ buyer: buyer._id, isDeleted: false }).session(session);
      if (!cart || cart.items.length === 0) throw new AppError("Your cart is empty.", 400);
      const version = Number(cart.get("__v") ?? 0);
      if (expectedVersion === undefined) expectedVersion = version;
      if (version !== expectedVersion) throw new AppError("Your cart changed. Please refresh and review it before ordering.", 409);
      const seen = new Set<string>();
      const items = [];
      for (const item of cart.items) {
        if (!item.product || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(String(item.product))) {
          throw new AppError("Invalid cart items. Please refresh your cart.", 400);
        }
        seen.add(String(item.product));
        const product = await Product.findOne({ _id: item.product, isActive: true, isDeleted: false }).session(session);
        if (!product || product.stock < item.quantity) throw new AppError(`${item.name} is unavailable or has insufficient stock. Please refresh your cart.`, 409);
        if (!Number.isFinite(product.price) || product.price < 0 || product.price !== item.price) {
          throw new AppError("Product prices changed. Please refresh your cart and review the updated prices before ordering.", 409);
        }
        items.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity,
          unit: product.unit, subtotal: product.price * item.quantity });
      }
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const [order] = await Order.create([{
        buyer: buyer._id,
        buyerSnapshot: { name: buyer.name, phone: buyer.phone, email: buyer.email, address: buyer.address },
        items, subtotal, taxAmount: 0, discountAmount: 0, totalAmount: subtotal, notes,
      }], { session });
      for (const item of items) {
        const result = await Product.updateOne(
          { _id: item.product, isActive: true, isDeleted: false, price: item.price, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } }, { session },
        );
        if (result.matchedCount !== 1) throw new AppError(`${item.name} changed or went out of stock. Please refresh your cart.`, 409);
      }
      cart.items = [];
      await cart.save({ session });
      return order;
    }, transactionOptions);
  } finally { await session.endSession(); }
}

export async function transitionOrder(orderId: string, newStatus: string) {
  if (!mongoose.isObjectIdOrHexString(orderId)) throw new AppError("Invalid order ID.", 400);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const order = await Order.findOne({ _id: orderId, isDeleted: false }).session(session);
      if (!order) throw new AppError("Order not found.", 404);
      const previousStatus = order.status;
      if (!(ORDER_TRANSITIONS[previousStatus] ?? []).includes(newStatus as OrderStatus)) {
        throw new AppError(`Invalid order status transition: ${previousStatus} → ${newStatus}.`, 409);
      }
      const claimed = await Order.findOneAndUpdate(
        { _id: orderId, isDeleted: false, status: previousStatus },
        { $set: { status: newStatus } }, { session, returnDocument: "after", runValidators: true },
      );
      if (!claimed) throw new AppError("Order status changed concurrently. Please refresh.", 409);
      if (newStatus === "cancelled") {
        for (const item of order.items) {
          if (!item.product || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
            throw new AppError("Order has invalid stock quantities; reconcile it before cancelling.", 409);
          }
          const result = await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
          if (result.matchedCount !== 1) throw new AppError("A product needed for stock restoration no longer exists. Reconcile the order first.", 409);
        }
      }
      return { order: claimed, previousStatus };
    }, transactionOptions);
  } finally { await session.endSession(); }
}
