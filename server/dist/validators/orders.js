"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusValidation = void 0;
const express_validator_1 = require("express-validator");
exports.statusValidation = [
    (0, express_validator_1.body)("status")
        .notEmpty()
        .isIn(["pending", "confirmed", "processing", "completed", "cancelled"])
        .withMessage("Invalid status value"),
];
