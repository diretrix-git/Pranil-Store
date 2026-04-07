import { body, ValidationChain } from "express-validator";

export const statusValidation: ValidationChain[] = [
  body("status")
    .notEmpty()
    .isIn(["pending", "confirmed", "processing", "completed", "cancelled"])
    .withMessage("Invalid status value"),
];
