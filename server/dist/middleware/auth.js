"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.protect = void 0;
const express_1 = require("@clerk/express");
const User_1 = __importDefault(require("../models/User"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const clerkClient = (0, express_1.createClerkClient)({
    secretKey: process.env.CLERK_SECRET_KEY,
});
// Verifies Clerk Bearer token and attaches req.user (MongoDB doc)
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return next(new AppError_1.default("Not authenticated. Please log in.", 401));
        }
        const token = authHeader.split(" ")[1];
        // Verify the Clerk session token
        let payload;
        try {
            payload = await (0, express_1.verifyToken)(token, {
                secretKey: process.env.CLERK_SECRET_KEY,
            });
        }
        catch {
            return next(new AppError_1.default("Invalid or expired session. Please log in again.", 401));
        }
        const clerkUserId = payload.sub;
        if (!clerkUserId)
            return next(new AppError_1.default("Invalid token payload.", 401));
        // Always fetch from Clerk to get the latest publicMetadata (role may have changed)
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        const clerkRole = clerkUser.publicMetadata?.role === "admin" ? "admin" : "buyer";
        // Find existing MongoDB user by clerkId
        let user = await User_1.default.findOne({ clerkId: clerkUserId, isDeleted: false });
        if (!user) {
            // First login — upsert into MongoDB
            const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
            const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email;
            const phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? "";
            user = await User_1.default.findOneAndUpdate({ email }, {
                $set: { clerkId: clerkUserId, role: clerkRole },
                $setOnInsert: { name, email, phone, password: "clerk-managed" },
            }, { upsert: true, new: true, runValidators: false });
        }
        else if (user.role !== clerkRole) {
            // Role changed in Clerk — sync it to MongoDB immediately
            user.role = clerkRole;
            await user.save();
        }
        if (!user)
            return next(new AppError_1.default("User not found.", 401));
        if (!user.isActive)
            return next(new AppError_1.default("Your account has been deactivated.", 403));
        req.user = user;
        next();
    }
    catch (err) {
        next(err);
    }
};
exports.protect = protect;
// Alias — some routes use requireAuth + protect, now they're the same
exports.requireAuth = exports.protect;
