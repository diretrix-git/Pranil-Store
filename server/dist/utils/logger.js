"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    levels: { error: 0, warn: 1, info: 2 },
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })),
    transports: [],
});
if (process.env.NODE_ENV === "production") {
    logger.add(new winston_1.default.transports.File({ filename: "logs/error.log", level: "error" }));
    logger.add(new winston_1.default.transports.File({ filename: "logs/combined.log" }));
}
else {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })),
    }));
}
exports.default = logger;
