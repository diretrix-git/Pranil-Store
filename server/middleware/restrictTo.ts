import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

export const restrictTo =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes((req as any).user?.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
