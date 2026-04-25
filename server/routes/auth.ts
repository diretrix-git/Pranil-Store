import { Router, Request, Response } from "express";
import { requireAuth, protect } from "../middleware/auth";
import { getMe } from "../controllers/auth";

const router = Router();

// Only endpoint needed — syncs Clerk session into MongoDB and returns role
router.get("/me", requireAuth, protect, getMe);

export default router;
