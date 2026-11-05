"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.getInvoice = exports.updateOrderStatus = exports.getBuyerOrders = exports.placeOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const orderTransactions_1 = require("../services/orderTransactions");
const redis_1 = require("../config/redis");
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const emailQueue_1 = require("../queues/emailQueue");
// Statuses that trigger a buyer notification email (not "processing")
const NOTIFIABLE_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled"]);
const placeOrder = async (req, res, next) => {
    try {
        const user = req.user;
        const order = await (0, orderTransactions_1.checkoutCart)(user, req.body.notes ?? "", req.body.cartVersion);
        // External side effects must not run in a retryable transaction callback.
        await (0, redis_1.invalidateProductCache)();
        const io = req.app.get("io");
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
        (0, emailQueue_1.queueEmail)({ type: "order_placed", order });
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
        const { order, previousStatus } = await (0, orderTransactions_1.transitionOrder)(req.params.orderId, newStatus);
        if (newStatus === "cancelled") {
            await (0, redis_1.invalidateProductCache)();
            logger_1.default.info(`Stock restored for cancelled order ${order.orderNumber}`);
        }
        // Send buyer status email — fire-and-forget
        if (NOTIFIABLE_STATUSES.has(newStatus) && newStatus !== previousStatus) {
            (0, emailQueue_1.queueEmail)({ type: "order_status", order, newStatus });
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
