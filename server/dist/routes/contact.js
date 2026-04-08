"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_1 = require("../controllers/contact");
const auth_1 = require("../middleware/auth");
const restrictTo_1 = require("../middleware/restrictTo");
const express_validator_1 = require("express-validator");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
const contactValidation = [
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("Name is required").escape(),
    (0, express_validator_1.body)("email").trim().isEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("subject").trim().notEmpty().withMessage("Subject is required").escape(),
    (0, express_validator_1.body)("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }).escape(),
];
router.post("/", contactValidation, validate_1.validate, contact_1.sendMessage);
router.get("/", auth_1.requireAuth, auth_1.protect, (0, restrictTo_1.restrictTo)("admin"), contact_1.getMessages);
router.patch("/:id/read", auth_1.requireAuth, auth_1.protect, (0, restrictTo_1.restrictTo)("admin"), contact_1.markRead);
exports.default = router;
