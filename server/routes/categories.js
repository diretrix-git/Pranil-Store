const express = require('express');
const { getCategories } = require('../controllers/categories');

const router = express.Router();

// Public — anyone can fetch categories
router.get('/', getCategories);

module.exports = router;
