const express = require('express');
const { getCategories, createCategory, deleteCategory } = require('../controllers/categories');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/restrictTo');

const router = express.Router();

router.get('/', getCategories);
router.post('/', protect, restrictTo('admin'), createCategory);
router.delete('/:id', protect, restrictTo('admin'), deleteCategory);

module.exports = router;
