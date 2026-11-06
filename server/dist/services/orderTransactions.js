"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutCart = checkoutCart;
exports.transitionOrder = transitionOrder;
const mongoose_1 = __importDefault(require("mongoose"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const TRANSITIONS = {
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
// No external side effects here: the driver may retry this entire callback.
async function checkoutCart(user, notes, cartVersion) {
    if (!Number.isSafeInteger(cartVersion) || cartVersion < 0) {
        throw new AppError_1.default("Please refresh your cart before ordering (cartVersion is required).", 400);
    }
    return mongoose_1.default.connection.transaction(async (session) => {
        const cart = await Cart_1.default.findOne({ buyer: user._id, isDeleted: false }).session(session);
        if (!cart || cart.items.length === 0)
            throw new AppError_1.default("Your cart is empty.", 400);
        if (cart.__v !== cartVersion) {
            throw new AppError_1.default("Your cart changed. Please refresh it and review the total before ordering.", 409);
        }
        const items = [];
        for (const item of cart.items) {
            if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
                !Number.isFinite(item.price) || item.price < 0) {
                throw new AppError_1.default("Invalid cart quantity or price. Please update your cart.", 400);
            }
            const product = await Product_1.default.findOne({
                _id: item.product, isActive: true, isDeleted: false,
            }).session(session);
            if (!product || product.stock < item.quantity) {
                throw new AppError_1.default(`${item.name} is unavailable or has insufficient stock. Please review your cart.`, 409);
            }
            if (product.price !== item.price) {
                throw new AppError_1.default("Product prices changed. Please refresh your cart and review the total before ordering.", 409);
            }
            // The conditional write also conflicts with concurrent catalog price or
            // availability changes. A retry reads both the cart and products afresh.
            const deduction = await Product_1.default.updateOne({
                _id: product._id, isActive: true, isDeleted: false,
                price: item.price, stock: { $gte: item.quantity },
            }, { $inc: { stock: -item.quantity } }, { session });
            if (deduction.matchedCount !== 1) {
                throw new AppError_1.default(`${item.name} changed or went out of stock. Please refresh your cart.`, 409);
            }
            const subtotal = item.price * item.quantity;
            if (!Number.isFinite(subtotal))
                throw new AppError_1.default("Invalid cart total.", 400);
            items.push({ product: product._id, name: item.name, price: item.price,
                quantity: item.quantity, unit: item.unit, subtotal });
        }
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        if (!Number.isFinite(subtotal))
            throw new AppError_1.default("Invalid cart total.", 400);
        const [order] = await Order_1.default.create([{
                buyer: user._id,
                buyerSnapshot: { name: user.name, phone: user.phone, email: user.email, address: user.address },
                items, subtotal, taxAmount: 0, discountAmount: 0, totalAmount: subtotal,
                notes, inventoryState: "reserved",
            }], { session });
        // This write serializes competing checkouts for the same cart. A competing
        // transaction retries and sees an empty cart, not another purchasable copy.
        cart.items = [];
        await cart.save({ session });
        return order;
    }, transactionOptions);
}
async function transitionOrder(orderId, newStatus) {
    if (!Object.prototype.hasOwnProperty.call(TRANSITIONS, newStatus)) {
        throw new AppError_1.default("Invalid status value.", 400);
    }
    return mongoose_1.default.connection.transaction(async (session) => {
        const order = await Order_1.default.findOne({ _id: orderId, isDeleted: false }).session(session);
        if (!order)
            throw new AppError_1.default("Order not found.", 404);
        const previousStatus = order.status;
        if (previousStatus === newStatus)
            return { order, changed: false };
        if (!TRANSITIONS[previousStatus]?.includes(newStatus)) {
            throw new AppError_1.default(`Cannot change order status from ${previousStatus} to ${newStatus}.`, 409);
        }
        if (newStatus === "cancelled" && order.inventoryState !== "reserved") {
            throw new AppError_1.default("This order requires inventory reconciliation before cancellation.", 409);
        }
        // The order write serializes concurrent status requests. Retried callbacks
        // observe the committed terminal state and do not restore stock again.
        order.status = newStatus;
        if (newStatus === "cancelled")
            order.inventoryState = "restored";
        await order.save({ session });
        if (newStatus === "cancelled") {
            for (const item of order.items) {
                if (!item.product || !Number.isSafeInteger(item.quantity) || item.quantity < 1) {
                    throw new AppError_1.default("Order inventory requires reconciliation before cancellation.", 409);
                }
                // Soft-deleted products still retain their inventory record. A missing
                // record must abort the whole cancellation, never silently skip a line.
                const restoration = await Product_1.default.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }, { session });
                if (restoration.matchedCount !== 1) {
                    throw new AppError_1.default("An order product is missing. Inventory reconciliation is required.", 409);
                }
            }
        }
        return { order, changed: true };
    }, transactionOptions);
}
