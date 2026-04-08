"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, _next) => {
    logger_1.default.error(`${req.method} ${req.originalUrl} — ${err.message}`);
    const isProduction = process.env.NODE_ENV === "production";
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: "error",
            message: err.message,
            errors: [],
            ...(isProduction ? {} : { stack: err.stack }),
        });
        return;
    }
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
        res.status(422).json({ status: "error", message: "Validation failed", errors });
        return;
    }
    if (err.name === "CastError") {
        res.status(400).json({ status: "error", message: "Invalid ID format", errors: [] });
        return;
    }
    if (err.code === 11000) {
        const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
        res.status(409).json({ status: "error", message: `Duplicate value for field: ${field}`, errors: [] });
        return;
    }
    if (err.name === "JsonWebTokenError") {
        res.status(401).json({ status: "error", message: "Invalid token", errors: [] });
        return;
    }
    if (err.name === "TokenExpiredError") {
        res.status(401).json({ status: "error", message: "Token expired. Please log in again", errors: [] });
        return;
    }
    res.status(500).json({
        status: "error",
        message: "Something went wrong",
        errors: [],
        ...(isProduction ? {} : { stack: err.stack }),
    });
};
exports.default = errorHandler;
