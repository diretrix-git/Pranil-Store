const { body } = require("express-validator");

const supplierValidation = [
  body("name")
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Supplier name is required"),
  body("email")
    .optional()
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage("Must be a valid email"),
  body("phone").optional().trim(),
  body("address").optional().trim().escape(),
  body("contactPerson").optional().trim().escape(),
  body("notes").optional().trim().escape(),
];

module.exports = { supplierValidation };
