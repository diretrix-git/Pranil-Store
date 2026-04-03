const { body } = require("express-validator");

const statusValidation = [
  body("status")
    .notEmpty()
    .isIn(["pending", "confirmed", "processing", "completed", "cancelled"])
    .withMessage("Invalid status value"),
];

module.exports = { statusValidation };
