import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { sendPasswordResetEmail } from "../utils/mailer";

const issueToken = (userId: string): string =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any,
  });

const setCookie = (res: Response, token: string): void => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;
    const existing = await User.findOne({ email, isDeleted: false });
    if (existing) return next(new AppError("Email already in use.", 409));

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, phone, password: hashedPassword, role: "buyer" });

    const token = issueToken(String(user._id));
    setCookie(res, token);

    res.status(201).json({
      status: "success",
      data: { user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } },
      message: "Registration successful",
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isDeleted: false }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn(`Failed login attempt for email: ${email}`);
      return next(new AppError("Invalid email or password.", 401));
    }
    if (!user.isActive) return next(new AppError("Your account has been deactivated.", 403));

    const token = issueToken(String(user._id));
    setCookie(res, token);

    res.status(200).json({
      status: "success",
      data: { user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } },
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.cookie("token", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 1 });
    res.status(200).json({ status: "success", data: null, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({ status: "success", data: { user: (req as any).user }, message: "User profile retrieved" });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), isDeleted: false }).select("+resetPasswordToken +resetPasswordExpires");

    // Always respond with success to prevent email enumeration
    if (!user) {
      res.status(200).json({ status: "success", data: null, message: "If that email exists, a reset link has been sent." });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL?.split(",")[0]}/reset-password/${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ status: "success", data: null, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return next(new AppError("Password must be at least 8 characters.", 422));
    }

    const hashedToken = crypto.createHash("sha256").update(token as string).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
      isDeleted: false,
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) return next(new AppError("Reset link is invalid or has expired.", 400));

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ status: "success", data: null, message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
};
