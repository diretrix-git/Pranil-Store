import { Router } from "express";
import { register, login, logout, getMe, forgotPassword, resetPassword } from "../controllers/auth";
import { registerValidation, loginValidation } from "../validators/auth";
import { validate } from "../middleware/validate";
import { protect } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { body } from "express-validator";

const router = Router();

router.use(authLimiter);

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/forgot-password", [body("email").trim().isEmail().withMessage("Valid email required")], validate, forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
