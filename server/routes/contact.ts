import { Router } from "express";
import { sendMessage, getMessages, markRead } from "../controllers/contact";
import { protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";
import { body } from "express-validator";
import { validate } from "../middleware/validate";
import rateLimit from "express-rate-limit";

const router = Router();

// Contact form rate limit — 5 submissions per 10 min per IP (prevents inbox spam)
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ status: "error", message: "Too many messages. Please wait before sending again.", errors: [] }),
});

const contactValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").escape(),
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("subject").trim().notEmpty().withMessage("Subject is required").escape(),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }).escape(),
];

router.post("/", contactLimiter, contactValidation, validate, sendMessage);
router.get("/", protect, restrictTo("admin"), getMessages);
router.patch("/:id/read", protect, restrictTo("admin"), markRead);

export default router;
