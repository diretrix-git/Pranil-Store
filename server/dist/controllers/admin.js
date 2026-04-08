"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformStats = exports.toggleUserStatus = exports.getAllUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const Order_1 = __importDefault(require("../models/Order"));
const Product_1 = __importDefault(require("../models/Product"));
const Contact_1 = __importDefault(require("../models/Contact"));
const Vendor_1 = __importDefault(require("../models/Vendor"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const getAllUsers = async (_req, res, next) => {
    try {
        const users = await User_1.default.find({ isDeleted: false, role: "buyer" }).select("-password");
        res.status(200).json({ status: "success", data: { users, count: users.length }, message: "Users retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getAllUsers = getAllUsers;
const toggleUserStatus = async (req, res, next) => {
    try {
        const user = await User_1.default.findOne({ _id: req.params.id, isDeleted: false });
        if (!user)
            return next(new AppError_1.default("User not found.", 404));
        user.isActive = !user.isActive;
        await user.save();
        res.status(200).json({
            status: "success",
            data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
            message: `User ${user.isActive ? "activated" : "deactivated"}`,
        });
    }
    catch (err) {
        next(err);
    }
};
exports.toggleUserStatus = toggleUserStatus;
const getPlatformStats = async (_req, res, next) => {
    try {
        const [totalBuyers, totalProducts, totalOrders, revenueAgg, unreadMessages, totalVendors, pendingOrders, lowStockProducts] = await Promise.all([
            User_1.default.countDocuments({ isDeleted: false, role: "buyer" }),
            Product_1.default.countDocuments({ isDeleted: false }),
            Order_1.default.countDocuments({ isDeleted: false }),
            Order_1.default.aggregate([{ $match: { isDeleted: false, status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
            Contact_1.default.countDocuments({ isDeleted: false, isRead: false }),
            Vendor_1.default.countDocuments({ isDeleted: false, isActive: true }),
            Order_1.default.countDocuments({ isDeleted: false, status: "pending" }),
            Product_1.default.countDocuments({ isDeleted: false, stock: { $gt: 0, $lt: 20 } }),
        ]);
        res.status(200).json({
            status: "success",
            data: {
                totalBuyers, totalProducts, totalOrders,
                totalRevenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
                unreadMessages, totalVendors, pendingOrders, lowStockProducts,
            },
            message: "Stats retrieved",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.getPlatformStats = getPlatformStats;
