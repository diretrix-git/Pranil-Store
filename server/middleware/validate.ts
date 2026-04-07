import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors: errors.array().map((e: any) => ({ field: e.path, message: e.msg })),
    });
    return;
  }
  next();
};
