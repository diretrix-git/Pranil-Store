import { Router } from "express";
import { getAllUsers, toggleUserStatus, getPlatformStats } from "../controllers/admin";
import { protect } from "../middleware/auth";
import { requireAuth } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.use(requireAuth, protect, restrictTo("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/status", toggleUserStatus);
router.get("/stats", getPlatformStats);

export default router;
