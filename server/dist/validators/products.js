"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productValidation = void 0;
const express_validator_1 = require("express-validator");
exports.productValidation = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("Product name is required").isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters").escape(),
    (0, express_validator_1.body)("price").notEmpty().withMessage("Price is required").isFloat({ min: 0 }).withMessage("Price must be a number >= 0"),
    (0, express_validator_1.body)("stock").notEmpty().withMessage("Stock is required").isInt({ min: 0 }).withMessage("Stock must be an integer >= 0"),
    (0, express_validator_1.body)("categories").notEmpty().withMessage("At least one category is required"),
    (0, express_validator_1.body)("description").optional().trim().escape(),
    (0, express_validator_1.body)("unit").optional().trim().escape(),
];
