import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import AppError from "../utils/AppError";

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = (req as any).cookies?.token;
    if (!token) return next(new AppError("Not authenticated. Please log in.", 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select("-password");

    if (!user) return next(new AppError("User no longer exists.", 401));
    if (user.isDeleted) return next(new AppError("User no longer exists.", 401));
    if (!user.isActive) return next(new AppError("Your account has been deactivated.", 403));

    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
};
