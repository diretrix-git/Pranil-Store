"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ORDER_TRANSITIONS = void 0;
exports.checkoutCart = checkoutCart;
exports.transitionOrder = transitionOrder;
const mongoose_1 = __importDefault(require("mongoose"));
const node_util_1 = require("node:util");
const Cart_1 = __importDefault(require("../models/Cart"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const AppError_1 = __importDefault(require("../utils/AppError"));
exports.ORDER_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
};
const transactionOptions = {
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" },
    readPreference: "primary",
};
// Required uniqueness must cover every cart/order, including deployment with
// autoIndex disabled. Never accept an index that only covers some statuses.
async function requireCheckoutIndexes() {
    await Cart_1.default.init();
    await Order_1.default.init();
    for (const [collection, field] of [[Cart_1.default.collection, "buyer"], [Order_1.default.collection, "orderNumber"]]) {
        const indexes = await collection.listIndexes().toArray();
        if (!indexes.some(index => index.unique === true && !index.sparse &&
            index.partialFilterExpression === undefined && index.expireAfterSeconds === undefined &&
            (!index.collation || index.collation.locale === "simple") &&
            (0, node_util_1.isDeepStrictEqual)(Object.entries(index.key), [[field, 1]]))) {
            throw new AppError_1.default("Required checkout indexes are missing or incompatible. Prepare order storage before accepting orders.", 503);
        }
    }
}
async function checkoutCart(buyer, notes = "", reviewedVersion) {
    if (reviewedVersion !== undefined && (!Number.isSafeInteger(reviewedVersion) || reviewedVersion < 0)) {
        throw new AppError_1.default("Invalid cart version. Please refresh your cart.", 400);
    }
    if (typeof notes !== "string")
        throw new AppError_1.default("Order notes must be text.", 400);
    await requireCheckoutIndexes();
    let expectedVersion = reviewedVersion;
    const session = await mongoose_1.default.startSession();
    try {
        return await session.withTransaction(async () => {
            const cart = await Cart_1.default.findOne({ buyer: buyer._id, isDeleted: false }).session(session);
            if (!cart || cart.items.length === 0)
                throw new AppError_1.default("Your cart is empty.", 400);
            const version = Number(cart.get("__v") ?? 0);
            if (expectedVersion === undefined)
                expectedVersion = version;
            if (version !== expectedVersion)
                throw new AppError_1.default("Your cart changed. Please refresh and review it before ordering.", 409);
            const seen = new Set();
            const items = [];
            for (const item of cart.items) {
                if (!item.product || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || seen.has(String(item.product))) {
                    throw new AppError_1.default("Invalid cart items. Please refresh your cart.", 400);
                }
                seen.add(String(item.product));
                const product = await Product_1.default.findOne({ _id: item.product, isActive: true, isDeleted: false }).session(session);
                if (!product || product.stock < item.quantity)
                    throw new AppError_1.default(`${item.name} is unavailable or has insufficient stock. Please refresh your cart.`, 409);
                if (!Number.isFinite(product.price) || product.price < 0 || product.price !== item.price) {
                    throw new AppError_1.default("Product prices changed. Please refresh your cart and review the updated prices before ordering.", 409);
                }
                items.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity,
                    unit: product.unit, subtotal: product.price * item.quantity });
            }
            const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
            const [order] = await Order_1.default.create([{
                    buyer: buyer._id,
                    buyerSnapshot: { name: buyer.name, phone: buyer.phone, email: buyer.email, address: buyer.address },
                    items, subtotal, taxAmount: 0, discountAmount: 0, totalAmount: subtotal, notes,
                }], { session });
            for (const item of items) {
                const result = await Product_1.default.updateOne({ _id: item.product, isActive: true, isDeleted: false, price: item.price, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { session });
                if (result.matchedCount !== 1)
                    throw new AppError_1.default(`${item.name} changed or went out of stock. Please refresh your cart.`, 409);
            }
            cart.items = [];
            await cart.save({ session });
            return order;
        }, transactionOptions);
    }
    finally {
        await session.endSession();
    }
}
async function transitionOrder(orderId, newStatus) {
    if (!mongoose_1.default.isObjectIdOrHexString(orderId))
        throw new AppError_1.default("Invalid order ID.", 400);
    const session = await mongoose_1.default.startSession();
    try {
        return await session.withTransaction(async () => {
            const order = await Order_1.default.findOne({ _id: orderId, isDeleted: false }).session(session);
            if (!order)
                throw new AppError_1.default("Order not found.", 404);
            const previousStatus = order.status;
            if (!(exports.ORDER_TRANSITIONS[previousStatus] ?? []).includes(newStatus)) {
                throw new AppError_1.default(`Invalid order status transition: ${previousStatus} → ${newStatus}.`, 409);
            }
            const claimed = await Order_1.default.findOneAndUpdate({ _id: orderId, isDeleted: false, status: previousStatus }, { $set: { status: newStatus } }, { session, returnDocument: "after", runValidators: true });
            if (!claimed)
                throw new AppError_1.default("Order status changed concurrently. Please refresh.", 409);
            if (newStatus === "cancelled") {
                for (const item of order.items) {
                    if (!item.product || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
                        throw new AppError_1.default("Order has invalid stock quantities; reconcile it before cancelling.", 409);
                    }
                    const result = await Product_1.default.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
                    if (result.matchedCount !== 1)
                        throw new AppError_1.default("A product needed for stock restoration no longer exists. Reconcile the order first.", 409);
                }
            }
            return { order: claimed, previousStatus };
        }, transactionOptions);
    }
    finally {
        await session.endSession();
    }
}
