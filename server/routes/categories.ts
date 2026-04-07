import { Router } from "express";
import { getCategories, createCategory, deleteCategory } from "../controllers/categories";
import { protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";

const router = Router();

router.get("/", getCategories);
router.post("/", protect, restrictTo("admin"), createCategory);
router.delete("/:id", protect, restrictTo("admin"), deleteCategory);

export default router;
