"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = exports.registerValidation = void 0;
const express_validator_1 = require("express-validator");
exports.registerValidation = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters").escape(),
    (0, express_validator_1.body)("email").trim().toLowerCase().isEmail().withMessage("Must be a valid email address"),
    (0, express_validator_1.body)("phone").trim().notEmpty().withMessage("Phone is required").matches(/^[+\d\s\-().]{7,20}$/).withMessage("Invalid phone format"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required").isLength({ min: 8 }).withMessage("Password must be at least 8 characters").matches(/^(?=.*[a-zA-Z])(?=.*\d)/).withMessage("Password must contain at least one letter and one number"),
];
exports.loginValidation = [
    (0, express_validator_1.body)("email").trim().toLowerCase().isEmail().withMessage("Must be a valid email address"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
