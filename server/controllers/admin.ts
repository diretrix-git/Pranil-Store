import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import Order from "../models/Order";
import Product from "../models/Product";
import Contact from "../models/Contact";
import Vendor from "../models/Vendor";
import AppError from "../utils/AppError";

export const getAllUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await User.find({ isDeleted: false, role: "buyer" }).select("-password");
    res.status(200).json({ status: "success", data: { users, count: users.length }, message: "Users retrieved" });
  } catch (err) { next(err); }
};

export const toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false });
    if (!user) return next(new AppError("User not found.", 404));
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      status: "success",
      data: { user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } },
      message: `User ${user.isActive ? "activated" : "deactivated"}`,
    });
  } catch (err) { next(err); }
};

export const getPlatformStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalBuyers, totalProducts, totalOrders, revenueAgg, unreadMessages, totalVendors, pendingOrders, lowStockProducts] =
      await Promise.all([
        User.countDocuments({ isDeleted: false, role: "buyer" }),
        Product.countDocuments({ isDeleted: false }),
        Order.countDocuments({ isDeleted: false }),
        Order.aggregate([{ $match: { isDeleted: false, status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
        Contact.countDocuments({ isDeleted: false, isRead: false }),
        Vendor.countDocuments({ isDeleted: false, isActive: true }),
        Order.countDocuments({ isDeleted: false, status: "pending" }),
        Product.countDocuments({ isDeleted: false, stock: { $gt: 0, $lt: 20 } }),
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
  } catch (err) { next(err); }
};
