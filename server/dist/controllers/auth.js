"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.getMe = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const logger_1 = __importDefault(require("../utils/logger"));
const mailer_1 = require("../utils/mailer");
const issueToken = (userId) => jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d"),
});
const setCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};
const register = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;
        const existing = await User_1.default.findOne({ email, isDeleted: false });
        if (existing)
            return next(new AppError_1.default("Email already in use.", 409));
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await User_1.default.create({ name, email, phone, password: hashedPassword, role: "buyer" });
        const token = issueToken(String(user._id));
        setCookie(res, token);
        res.status(201).json({
            status: "success",
            data: { user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } },
            message: "Registration successful",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email, isDeleted: false }).select("+password");
        if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
            logger_1.default.warn(`Failed login attempt for email: ${email}`);
            return next(new AppError_1.default("Invalid email or password.", 401));
        }
        if (!user.isActive)
            return next(new AppError_1.default("Your account has been deactivated.", 403));
        const token = issueToken(String(user._id));
        setCookie(res, token);
        res.status(200).json({
            status: "success",
            data: { user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } },
            message: "Login successful",
        });
    }
    catch (err) {
        next(err);
    }
};
exports.login = login;
const logout = async (_req, res, next) => {
    try {
        res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 1 });
        res.status(200).json({ status: "success", data: null, message: "Logged out successfully" });
    }
    catch (err) {
        next(err);
    }
};
exports.logout = logout;
const getMe = async (req, res, next) => {
    try {
        res.status(200).json({ status: "success", data: { user: req.user }, message: "User profile retrieved" });
    }
    catch (err) {
        next(err);
    }
};
exports.getMe = getMe;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User_1.default.findOne({ email: email?.toLowerCase(), isDeleted: false }).select("+resetPasswordToken +resetPasswordExpires");
        // Always respond with success to prevent email enumeration
        if (!user) {
            res.status(200).json({ status: "success", data: null, message: "If that email exists, a reset link has been sent." });
            return;
        }
        const rawToken = crypto_1.default.randomBytes(32).toString("hex");
        user.resetPasswordToken = crypto_1.default.createHash("sha256").update(rawToken).digest("hex");
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await user.save();
        const resetUrl = `${process.env.CLIENT_URL?.split(",")[0]}/reset-password/${rawToken}`;
        await (0, mailer_1.sendPasswordResetEmail)(user.email, resetUrl);
        res.status(200).json({ status: "success", data: null, message: "If that email exists, a reset link has been sent." });
    }
    catch (err) {
        next(err);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password || password.length < 8) {
            return next(new AppError_1.default("Password must be at least 8 characters.", 422));
        }
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await User_1.default.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() },
            isDeleted: false,
        }).select("+resetPasswordToken +resetPasswordExpires");
        if (!user)
            return next(new AppError_1.default("Reset link is invalid or has expired.", 400));
        user.password = await bcryptjs_1.default.hash(password, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.status(200).json({ status: "success", data: null, message: "Password reset successful. You can now log in." });
    }
    catch (err) {
        next(err);
    }
};
exports.resetPassword = resetPassword;
