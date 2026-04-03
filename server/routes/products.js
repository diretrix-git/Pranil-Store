const express = require("express");
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/products");
const { productValidation } = require("../validators/products");
const { uploadProductImages } = require("../utils/cloudinaryHelper");
const { validate } = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const { restrictTo } = require("../middleware/restrictTo");
const { uploadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProduct);

// Admin only
router.post(
  "/",
  protect,
  restrictTo("admin"),
  uploadLimiter,
  uploadProductImages,
  productValidation,
  validate,
  createProduct,
);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  uploadLimiter,
  uploadProductImages,
  validate,
  updateProduct,
);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);

module.exports = router;
