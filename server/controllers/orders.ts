import { Request, Response, NextFunction } from "express";
import Cart from "../models/Cart";
import Order from "../models/Order";
import Product from "../models/Product";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { queueEmail } from "../queues/emailQueue";

// Statuses that trigger a buyer notification email (not "processing")
const NOTIFIABLE_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled"]);

export const placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const cart = await Cart.findOne({ buyer: user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) return next(new AppError("Your cart is empty.", 400));

    const stockErrors: string[] = [];
    for (const item of cart.items) {
      const prod = item.product as any;
      if (!prod || prod.stock < item.quantity) {
        stockErrors.push(`${item.name} (available: ${prod?.stock ?? 0})`);
      }
    }
    if (stockErrors.length > 0) return next(new AppError(`Insufficient stock for: ${stockErrors.join(", ")}`, 409));

    const items = cart.items.map((item) => {
      const prod = item.product as any;
      return { product: prod._id, name: item.name, price: item.price, quantity: item.quantity, unit: item.unit, subtotal: item.price * item.quantity };
    });

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

    const order = await Order.create({
      buyer: user._id,
      buyerSnapshot: { name: user.name, phone: user.phone, email: user.email, address: user.address },
      items,
      subtotal,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      notes: req.body.notes || "",
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate((item.product as any)._id, { $inc: { stock: -item.quantity } });
    }

    cart.items = [];
    await cart.save();

    const io = (req.app as any).get("io");
    if (io) {
      io.to("admin_room").emit("new_order", {
        orderNumber: order.orderNumber,
        buyerName: user.name,
        buyerPhone: user.phone || "",
        buyerId: user._id,
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        totalAmount: order.totalAmount,
        orderId: order._id,
        placedAt: order.createdAt,
      });
    }

    // Send emails — fire-and-forget, non-blocking
    queueEmail({ type: "order_placed", order });

    res.status(201).json({ status: "success", data: { order }, message: "Order placed successfully" });
  } catch (err) { next(err); }
};

export const getBuyerOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find({ buyer: (req as any).user._id, isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: { orders, count: orders.length }, message: "Orders retrieved" });
  } catch (err) { next(err); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
    if (!order) return next(new AppError("Order not found.", 404));

    const previousStatus = order.status;
    const newStatus = req.body.status as string;

    order.status = newStatus as any;
    await order.save();

    // Restore stock when order is cancelled (only if it wasn't already cancelled)
    if (newStatus === "cancelled" && previousStatus !== "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
      logger.info(`Stock restored for cancelled order ${order.orderNumber}`);
    }

    // Send buyer status email — fire-and-forget
    if (NOTIFIABLE_STATUSES.has(newStatus) && newStatus !== previousStatus) {
      queueEmail({ type: "order_status", order, newStatus });
    }

    res.status(200).json({ status: "success", data: { order }, message: "Order status updated" });
  } catch (err) { next(err); }
};

export const getInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, isDeleted: false });
    if (!order) return next(new AppError("Order not found.", 404));
    const user = (req as any).user;
    if (user.role === "buyer" && order.buyer.toString() !== String(user._id)) {
      return next(new AppError("Not authorized.", 403));
    }
    res.status(200).json({ status: "success", data: { order }, message: "Invoice retrieved" });
  } catch (err) { next(err); }
};

export const getAllOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find({ isDeleted: false }).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", data: { orders, count: orders.length }, message: "All orders retrieved" });
  } catch (err) { next(err); }
};
