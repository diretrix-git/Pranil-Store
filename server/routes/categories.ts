import { Router } from "express";
import { getCategories, createCategory, deleteCategory } from "../controllers/categories";
import { requireAuth, protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get("/", getCategories);
router.post("/", requireAuth, protect, restrictTo("admin"), createCategory);
router.delete("/:id", requireAuth, protect, restrictTo("admin"), deleteCategory);

export default router;
