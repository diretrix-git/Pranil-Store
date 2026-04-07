import { Router } from "express";
import { sendMessage, getMessages, markRead } from "../controllers/contact";
import { protect } from "../middleware/auth";
import { restrictTo } from "../middleware/restrictTo";
import { body } from "express-validator";
import { validate } from "../middleware/validate";

const router = Router();

const contactValidation = [
  body("name").trim().notEmpty().withMessage("Name is required").escape(),
  body("email").trim().isEmail().withMessage("Valid email required"),
  body("subject").trim().notEmpty().withMessage("Subject is required").escape(),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 2000 }).escape(),
];

router.post("/", contactValidation, validate, sendMessage);
router.get("/", protect, restrictTo("admin"), getMessages);
router.patch("/:id/read", protect, restrictTo("admin"), markRead);

export default router;
