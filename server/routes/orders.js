const express = require('express');
const { placeOrder, getBuyerOrders, updateOrderStatus, getInvoice, getAllOrders } = require('../controllers/orders');
const { statusValidation } = require('../validators/orders');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/restrictTo');
const { orderLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', protect, restrictTo('buyer'), orderLimiter, placeOrder);
router.get('/my', protect, restrictTo('buyer'), getBuyerOrders);
router.get('/:orderId/invoice', protect, getInvoice);
router.get('/', protect, restrictTo('admin'), getAllOrders);
router.patch('/:orderId/status', protect, restrictTo('admin'), statusValidation, validate, updateOrderStatus);

module.exports = router;
