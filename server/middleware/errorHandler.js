const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`);

  const isProduction = process.env.NODE_ENV === "production";

  // Operational errors thrown via AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      errors: [],
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      status: "error",
      message: "Validation failed",
      errors,
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "error",
      message: "Invalid ID format",
      errors: [],
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    return res.status(409).json({
      status: "error",
      message: `Duplicate value for field: ${field}`,
      errors: [],
      ...(isProduction ? {} : { stack: err.stack }),
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
      errors: [],
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: "error",
      message: "Token expired. Please log in again",
      errors: [],
    });
  }

  // Unhandled / non-operational errors
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
    errors: [],
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
