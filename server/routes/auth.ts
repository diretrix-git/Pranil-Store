import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, protect } from "../middleware/auth";

const router = Router();

// Called by the client after Clerk sign-in to sync user into MongoDB
// requireAuth validates the Clerk session; protect upserts the MongoDB record
router.get("/me", requireAuth, protect, (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    data: { user: (req as any).user },
    message: "User profile retrieved",
  });
});

export default router;
