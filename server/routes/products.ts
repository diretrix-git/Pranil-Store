import { Router } from "express";
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct } from "../controllers/products";
import { productValidation } from "../validators/products";
import { uploadProductImages } from "../utils/cloudinaryHelper";
import { validate } from "../middleware/validate";
import { requireAuth, protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";
import { uploadLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", requireAuth, protect, restrictTo("admin"), uploadLimiter, uploadProductImages, productValidation, validate, createProduct);
router.put("/:id", requireAuth, protect, restrictTo("admin"), uploadLimiter, uploadProductImages, validate, updateProduct);
router.delete("/:id", requireAuth, protect, restrictTo("admin"), deleteProduct);

export default router;
