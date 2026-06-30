import { Router } from "express";
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct } from "../controllers/products";
import { productValidation } from "../validators/products";
import { uploadProductImages } from "../utils/cloudinaryHelper";
import { validate } from "../middleware/validate";
import { protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";
import { uploadLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProduct);
router.post("/", protect, restrictTo("admin"), uploadLimiter, uploadProductImages, productValidation, validate, createProduct);
router.put("/:id", protect, restrictTo("admin"), uploadLimiter, uploadProductImages, validate, updateProduct);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);

export default router;
