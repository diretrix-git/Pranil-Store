const { body } = require('express-validator');

const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .escape(),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a number >= 0'),

  body('stock')
    .notEmpty().withMessage('Stock is required')
    .isInt({ min: 0 }).withMessage('Stock must be an integer >= 0'),

  // categories is sent as a comma-separated string of IDs — just check it's not empty
  body('categories')
    .notEmpty().withMessage('At least one category is required'),

  body('description').optional().trim().escape(),
  body('unit').optional().trim().escape(),
];

module.exports = { productValidation };
