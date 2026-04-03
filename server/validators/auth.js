const { body } = require('express-validator');

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters')
    .escape(),

  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Must be a valid email address'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone is required')
    .matches(/^[+\d\s\-().]{7,20}$/).withMessage('Invalid phone format'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
];

const loginValidation = [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Must be a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerValidation, loginValidation };
