"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const Sentry = __importStar(require("@sentry/node"));
Sentry.init({ dsn: process.env.SENTRY_DSN });
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const express_1 = require("@clerk/express");
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
const logger_1 = __importDefault(require("./utils/logger"));
const User_1 = __importDefault(require("./models/User"));
const emailQueue_1 = require("./queues/emailQueue");
// ── Validate required env vars before anything else ───────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
    console.error("Set these in your Render dashboard under Environment.");
    process.exit(1);
}
const PORT = Number(process.env.PORT) || 5000;
const httpServer = http_1.default.createServer(app_1.default);
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true, methods: ["GET", "POST"] },
});
app_1.default.set("io", io);
io.use(async (socket, next) => {
    try {
        // Clerk session token passed as auth header from client
        const token = socket.handshake.auth?.token;
        if (!token)
            return next(new Error("Not authenticated"));
        const payload = await (0, express_1.verifyToken)(token, { secretKey: process.env.CLERK_SECRET_KEY });
        const clerkUserId = payload.sub;
        const user = await User_1.default.findOne({ clerkId: clerkUserId, isDeleted: false });
        if (!user || !user.isActive)
            return next(new Error("User not found"));
        if (user.role !== "admin")
            return next(new Error("Admins only"));
        socket.user = user;
        next();
    }
    catch {
        next(new Error("Invalid token"));
    }
});
io.on("connection", (socket) => {
    const user = socket.user;
    logger_1.default.info(`Socket connected: admin ${user.email}`);
    socket.on("join_admin_room", () => {
        socket.join("admin_room");
        logger_1.default.info(`Admin ${user.email} joined admin_room`);
    });
    socket.on("disconnect", () => {
        logger_1.default.info(`Socket disconnected: ${user.email}`);
    });
});
const startServer = async () => {
    try {
        await (0, db_1.default)();
        (0, emailQueue_1.startEmailWorker)();
        httpServer.listen(PORT, "0.0.0.0", () => {
            logger_1.default.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
        });
    }
    catch (err) {
        console.error("FATAL: Server failed to start:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
};
startServer();
process.on("unhandledRejection", (err) => {
    logger_1.default.error(`Unhandled Rejection: ${err.message}`);
    process.exit(1);
});
process.on("uncaughtException", (err) => {
    logger_1.default.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});
