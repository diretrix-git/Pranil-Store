import { Request, Response, NextFunction } from "express";
import { createClerkClient, verifyToken } from "@clerk/express";
import User from "../models/User";
import AppError from "../utils/AppError";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// Verifies Clerk Bearer token and attaches req.user (MongoDB doc)
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return next(new AppError("Not authenticated. Please log in.", 401));
    }

    const token = authHeader.split(" ")[1];

    // Verify the Clerk session token
    let payload: any;
    try {
      payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
    } catch {
      return next(new AppError("Invalid or expired session. Please log in again.", 401));
    }

    const clerkUserId = payload.sub;
    if (!clerkUserId) return next(new AppError("Invalid token payload.", 401));

    // Always fetch from Clerk to get the latest publicMetadata (role may have changed)
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    const clerkRole = (clerkUser.publicMetadata?.role as string) === "admin" ? "admin" : "buyer";

    // Find existing MongoDB user by clerkId
    let user = await User.findOne({ clerkId: clerkUserId, isDeleted: false });

    if (!user) {
      // First login — upsert into MongoDB
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email;
      const phone = clerkUser.phoneNumbers[0]?.phoneNumber ?? "";

      user = await User.findOneAndUpdate(
        { email },
        {
          $set: { clerkId: clerkUserId, role: clerkRole },
          $setOnInsert: { name, email, phone, password: "clerk-managed" },
        },
        { upsert: true, new: true },
      );
    } else if (user.role !== clerkRole) {
      // Role changed in Clerk — sync it to MongoDB immediately
      user.role = clerkRole as any;
      await user.save();
    }

    if (!user) return next(new AppError("User not found.", 401));
    if (!user.isActive) return next(new AppError("Your account has been deactivated.", 403));

    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
};

// Alias — some routes use requireAuth + protect, now they're the same
export const requireAuth = protect;
