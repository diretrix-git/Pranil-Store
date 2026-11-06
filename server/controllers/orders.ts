import { Request, Response, NextFunction } from "express";
import Order from "../models/Order";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { queueEmail } from "../queues/emailQueue";
import { invalidateProductCache } from "../config/redis";
import { checkoutCart, transitionOrder } from "../services/orderTransactions";

// Statuses that trigger a buyer notification email (not "processing")
const NOTIFIABLE_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled"]);

// Delivery/cache errors cannot undo a committed purchase. Keep each channel
// independent so one failed notification does not suppress the others.
async function afterCommit(label: string, effect: () => unknown): Promise<void> {
  let timeout: ReturnType<typeof setTimeout>;
  try {
    await Promise.race([
      Promise.resolve().then(effect),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Delivery deadline exceeded")), 1000);
      }),
    ]);
  }
  catch (error) { logger.warn(`Post-commit ${label} failed: ${(error as Error).message}`); }
  finally { clearTimeout(timeout); }
}

export const placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const order = await checkoutCart(user, req.body.notes || "", req.body.cartVersion);

    await afterCommit("product cache invalidation", () => invalidateProductCache());
    const io = (req.app as any).get("io");
    if (io) {
      await afterCommit("admin order notification", () => io.to("admin_room").emit("new_order", {
        orderNumber: order.orderNumber,
        buyerName: user.name,
        buyerPhone: user.phone || "",
        buyerId: user._id,
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price, subtotal: i.subtotal })),
        totalAmount: order.totalAmount,
        orderId: order._id,
        placedAt: order.createdAt,
      }));
    }

    // Send emails — fire-and-forget, non-blocking
    await afterCommit("order confirmation", () => queueEmail({ type: "order_placed", order }));

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
    const newStatus = req.body.status as string;
    const { order, changed } = await transitionOrder(String(req.params.orderId), newStatus);
    if (changed && newStatus === "cancelled") {
      logger.info(`Stock restored for cancelled order ${order.orderNumber}`);
      await afterCommit("product cache invalidation", () => invalidateProductCache());
    }
    if (changed && NOTIFIABLE_STATUSES.has(newStatus)) {
      await afterCommit("order status notification", () => queueEmail({ type: "order_status", order, newStatus }));
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
    const orders = await Order.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(500); // prevent mass extraction
    res.status(200).json({ status: "success", data: { orders, count: orders.length }, message: "All orders retrieved" });
  } catch (err) { next(err); }
};
