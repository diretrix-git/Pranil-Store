"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.getInvoice = exports.updateOrderStatus = exports.getBuyerOrders = exports.placeOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const emailQueue_1 = require("../queues/emailQueue");
const redis_1 = require("../config/redis");
const orderTransactions_1 = require("../services/orderTransactions");
// Statuses that trigger a buyer notification email (not "processing")
const NOTIFIABLE_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled"]);
// Delivery/cache errors cannot undo a committed purchase. Keep each channel
// independent so one failed notification does not suppress the others.
async function afterCommit(label, effect) {
    let timeout;
    try {
        await Promise.race([
            Promise.resolve().then(effect),
            new Promise((_, reject) => {
                timeout = setTimeout(() => reject(new Error("Delivery deadline exceeded")), 1000);
            }),
        ]);
    }
    catch (error) {
        logger_1.default.warn(`Post-commit ${label} failed: ${error.message}`);
    }
    finally {
        clearTimeout(timeout);
    }
}
const placeOrder = async (req, res, next) => {
    try {
        const user = req.user;
        const order = await (0, orderTransactions_1.checkoutCart)(user, req.body.notes || "", req.body.cartVersion);
        await afterCommit("product cache invalidation", () => (0, redis_1.invalidateProductCache)());
        const io = req.app.get("io");
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
        await afterCommit("order confirmation", () => (0, emailQueue_1.queueEmail)({ type: "order_placed", order }));
        res.status(201).json({ status: "success", data: { order }, message: "Order placed successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.placeOrder = placeOrder;
const getBuyerOrders = async (req, res, next) => {
    try {
        const orders = await Order_1.default.find({ buyer: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
        res.status(200).json({ status: "success", data: { orders, count: orders.length }, message: "Orders retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getBuyerOrders = getBuyerOrders;
const updateOrderStatus = async (req, res, next) => {
    try {
        const newStatus = req.body.status;
        const { order, changed } = await (0, orderTransactions_1.transitionOrder)(String(req.params.orderId), newStatus);
        if (changed && newStatus === "cancelled") {
            logger_1.default.info(`Stock restored for cancelled order ${order.orderNumber}`);
            await afterCommit("product cache invalidation", () => (0, redis_1.invalidateProductCache)());
        }
        if (changed && NOTIFIABLE_STATUSES.has(newStatus)) {
            await afterCommit("order status notification", () => (0, emailQueue_1.queueEmail)({ type: "order_status", order, newStatus }));
        }
        res.status(200).json({ status: "success", data: { order }, message: "Order status updated" });
    }
    catch (err) {
        next(err);
    }
};
exports.updateOrderStatus = updateOrderStatus;
const getInvoice = async (req, res, next) => {
    try {
        const order = await Order_1.default.findOne({ _id: req.params.orderId, isDeleted: false });
        if (!order)
            return next(new AppError_1.default("Order not found.", 404));
        const user = req.user;
        if (user.role === "buyer" && order.buyer.toString() !== String(user._id)) {
            return next(new AppError_1.default("Not authorized.", 403));
        }
        res.status(200).json({ status: "success", data: { order }, message: "Invoice retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getInvoice = getInvoice;
const getAllOrders = async (_req, res, next) => {
    try {
        const orders = await Order_1.default.find({ isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(500); // prevent mass extraction
        res.status(200).json({ status: "success", data: { orders, count: orders.length }, message: "All orders retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllOrders = getAllOrders;
