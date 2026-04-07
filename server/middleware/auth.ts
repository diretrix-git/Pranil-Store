import { Request, Response, NextFunction } from "express";
import { clerkClient, requireAuth as clerkRequireAuth } from "@clerk/express";
import User from "../models/User";
import AppError from "../utils/AppError";

// Clerk's built-in middleware — rejects requests with no valid session
export const requireAuth = clerkRequireAuth();

// Attaches req.user (MongoDB doc) after verifying Clerk session
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clerkUserId = (req as any).auth?.userId;
    if (!clerkUserId) return next(new AppError("Not authenticated. Please log in.", 401));

    // Look up MongoDB user by clerkId
    let user = await User.findOne({ clerkId: clerkUserId, isDeleted: false });

    if (!user) {
      // First time — sync from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const role = (clerkUser.publicMetadata?.role as string) === "admin" ? "admin" : "buyer";

      user = await User.findOneAndUpdate(
        { email },
        {
          $setOnInsert: {
            name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email,
            email,
            phone: clerkUser.phoneNumbers[0]?.phoneNumber ?? "",
            password: "clerk-managed",
            role,
            clerkId: clerkUserId,
          },
        },
        { upsert: true, new: true },
      );
    }

    if (!user) return next(new AppError("User not found.", 401));
    if (!user.isActive) return next(new AppError("Your account has been deactivated.", 403));

    (req as any).user = user;
    next();
  } catch (err) {
    next(err);
  }
};
