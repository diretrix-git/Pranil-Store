import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

const json429 = (_req: Request, res: Response) => {
  res.status(429).json({
    status: "error",
    message: "Too many requests. Please slow down and try again later.",
    errors: [],
  });
};

// Auth endpoints — strict: 10 attempts per 15 min per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

// General API — 200 req per minute per IP
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

// Order placement — 5 orders per minute per IP (prevents spam orders)
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});

// File uploads — 20 uploads per 10 min per IP
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: json429,
});
