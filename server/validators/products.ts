import { body, ValidationChain } from "express-validator";

export const productValidation: ValidationChain[] = [
  body("name").trim().notEmpty().withMessage("Product name is required").isLength({ min: 2, max: 100 }).withMessage("Name must be 2–100 characters").escape(),
  body("price").notEmpty().withMessage("Price is required").isFloat({ min: 0 }).withMessage("Price must be a number >= 0"),
  body("stock").notEmpty().withMessage("Stock is required").isInt({ min: 0 }).withMessage("Stock must be an integer >= 0"),
  body("categories").notEmpty().withMessage("At least one category is required"),
  body("description").optional().trim().escape(),
  body("unit").optional().trim().escape(),
];
