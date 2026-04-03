const { body } = require('express-validator');

const productValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2–100 characters'),

  body('price')
    .notEmpty()
    .isFloat({ min: 0 })
    .withMessage('Price must be a number >= 0'),

  body('stock')
    .notEmpty()
    .isInt({ min: 0 })
    .withMessage('Stock must be an integer >= 0'),

  body('category')
    .trim()
    .escape()
    .notEmpty()
    .withMessage('Category is required'),

  body('description').optional().trim().escape(),

  body('unit').optional().trim().escape(),
];

module.exports = { productValidation };
