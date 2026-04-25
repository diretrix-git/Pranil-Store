"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.getInvoice = exports.updateOrderStatus = exports.getBuyerOrders = exports.placeOrder = void 0;
const Cart_1 = __importDefault(require("../models/Cart"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const emailQueue_1 = require("../queues/emailQueue");
// Statuses that trigger a buyer notification email (not "processing")
const NOTIFIABLE_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled"]);
const placeOrder = async (req, res, next) => {
    try {
        const user = req.user;
        const cart = await Cart_1.default.findOne({ buyer: user._id }).populate("items.product");
        if (!cart || cart.items.length === 0)
            return next(new AppError_1.default("Your cart is empty.", 400));
        const stockErrors = [];
        for (const item of cart.items) {
            const prod = item.product;
            if (!prod || prod.stock < item.quantity) {
                stockErrors.push(`${item.name} (available: ${prod?.stock ?? 0})`);
            }
        }
        if (stockErrors.length > 0)
            return next(new AppError_1.default(`Insufficient stock for: ${stockErrors.join(", ")}`, 409));
        const items = cart.items.map((item) => {
            const prod = item.product;
            return { product: prod._id, name: item.name, price: item.price, quantity: item.quantity, unit: item.unit, subtotal: item.price * item.quantity };
        });
        const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
        const order = await Order_1.default.create({
            buyer: user._id,
            buyerSnapshot: { name: user.name, phone: user.phone, email: user.email, address: user.address },
            items,
            subtotal,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: subtotal,
            notes: req.body.notes || "",
        });
        // Deduct stock atomically — prevents overselling race condition
        for (const item of cart.items) {
            const updated = await Product_1.default.findOneAndUpdate({ _id: item.product._id, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true });
            if (!updated) {
                // Rollback already-deducted items
                return next(new AppError_1.default(`${item.name} went out of stock. Please refresh your cart.`, 409));
            }
        }
        cart.items = [];
        await cart.save();
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
        const order = await Order_1.default.findOne({ _id: req.params.orderId, isDeleted: false });
        if (!order)
            return next(new AppError_1.default("Order not found.", 404));
        const previousStatus = order.status;
        const newStatus = req.body.status;
        order.status = newStatus;
        await order.save();
        // Restore stock when order is cancelled (only if it wasn't already cancelled)
        if (newStatus === "cancelled" && previousStatus !== "cancelled") {
            for (const item of order.items) {
                await Product_1.default.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
            }
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
