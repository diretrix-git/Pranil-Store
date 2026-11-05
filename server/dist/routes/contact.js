"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_1 = require("../controllers/contact");
const auth_1 = require("../middleware/auth");
const restrictTo_1 = require("../middleware/restrictTo");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Contact form rate limit — 5 submissions per 10 min per IP (prevents inbox spam)
const contactLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ status: "error", message: "Too many messages. Please wait before sending again.", errors: [] }),
});
const contactValidation = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("Name is required").escape(),
    (0, express_validator_1.body)("email").trim().isEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("subject").trim().notEmpty().withMessage("Subject is required").escape(),
    (0, express_validator_1.body)("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }).escape(),
];
router.post("/", contactLimiter, contactValidation, validate_1.validate, contact_1.sendMessage);
router.get("/", auth_1.protect, (0, restrictTo_1.restrictTo)("admin"), contact_1.getMessages);
router.patch("/:id/read", auth_1.protect, (0, restrictTo_1.restrictTo)("admin"), contact_1.markRead);
exports.default = router;
