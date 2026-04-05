const express = require('express');
const { getVendors, getAllVendors, createVendor, updateVendor, deleteVendor } = require('../controllers/vendors');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/restrictTo');

const router = express.Router();

// Admin only — /all must come BEFORE /:id to avoid Express matching 'all' as an ID
router.get('/all', protect, restrictTo('admin'), getAllVendors);
router.post('/', protect, restrictTo('admin'), createVendor);
router.put('/:id', protect, restrictTo('admin'), updateVendor);
router.delete('/:id', protect, restrictTo('admin'), deleteVendor);

// Public — buyers can see vendor list for filtering
router.get('/', getVendors);

module.exports = router;
