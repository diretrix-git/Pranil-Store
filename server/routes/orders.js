const express = require('express');
const { placeOrder, getBuyerOrders, getStoreOrders, updateOrderStatus, getInvoice, getAllOrders } = require('../controllers/orders');
const { statusValidation } = require('../validators/orders');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { requireStore } = require('../middleware/requireStore');
const { restrictTo } = require('../middleware/restrictTo');
const { orderLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', protect, restrictTo('buyer'), orderLimiter, placeOrder);
router.get('/my', protect, restrictTo('buyer'), getBuyerOrders);
router.get('/store', protect, requireStore, restrictTo('seller'), getStoreOrders);
router.patch('/:orderId/status', protect, requireStore, restrictTo('seller'), statusValidation, validate, updateOrderStatus);
router.get('/:orderId/invoice', protect, getInvoice);
router.get('/', protect, restrictTo('superadmin'), getAllOrders);

module.exports = router;
