import { Request, Response, NextFunction } from "express";

// Auth is fully managed by Clerk.
// This controller only handles the /me endpoint which syncs Clerk → MongoDB.
// All registration, login, logout, and password reset is handled by Clerk's hosted UI.

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      status: "success",
      data: { user: (req as any).user },
      message: "User profile retrieved",
    });
  } catch (err) {
    next(err);
  }
};
