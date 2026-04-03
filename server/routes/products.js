const express = require('express');
const { createProduct, getProducts, getProduct, updateProduct, deleteProduct } = require('../controllers/products');
const { productValidation } = require('../validators/products');
const { uploadProductImages } = require('../utils/cloudinaryHelper');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { requireStore } = require('../middleware/requireStore');
const { restrictTo } = require('../middleware/restrictTo');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Seller-protected routes
router.use(protect, requireStore, restrictTo('seller'), uploadLimiter);

router.post('/', uploadProductImages, productValidation, validate, createProduct);
router.put('/:id', uploadProductImages, validate, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
