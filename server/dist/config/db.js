"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("../utils/logger"));
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGO_URI);
        logger_1.default.info(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (err) {
        logger_1.default.error(`MongoDB connection failed: ${err.message}`);
        process.exit(1);
    }
};
exports.default = connectDB;
