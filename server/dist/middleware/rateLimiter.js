"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLimiter = exports.orderLimiter = exports.generalLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const json429 = (_req, res) => {
    res.status(429).json({
        status: "error",
        message: "Too many requests. Please slow down and try again later.",
        errors: [],
    });
};
// Auth endpoints — strict: 10 attempts per 15 min per IP
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429,
});
// General API — 200 req per minute per IP
exports.generalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429,
});
// Order placement — 5 orders per minute per IP (prevents spam orders)
exports.orderLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429,
});
// File uploads — 20 uploads per 10 min per IP
exports.uploadLimiter = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: json429,
});
