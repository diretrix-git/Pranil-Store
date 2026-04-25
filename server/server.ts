import "dotenv/config";
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

import http from "http";
import { Server } from "socket.io";
import { verifyToken } from "@clerk/express";
import app from "./app";
import connectDB from "./config/db";
import logger from "./utils/logger";
import User from "./models/User";
import { startEmailWorker } from "./queues/emailQueue";

// ── Validate required env vars before anything else ───────────────────────────
const REQUIRED_ENV = ["MONGO_URI", "CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(", ")}`);
  console.error("Set these in your Render dashboard under Environment.");
  process.exit(1);
}

// Warn about optional but important vars
const OPTIONAL_ENV = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "UPSTASH_REDIS_REST_URL"];
const missingOptional = OPTIONAL_ENV.filter((k) => !process.env[k]);
if (missingOptional.length > 0) {
  console.warn(`WARNING: Optional env vars not set: ${missingOptional.join(", ")} — some features may not work`);
}

const PORT = Number(process.env.PORT) || 5000;

const httpServer = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, credentials: true, methods: ["GET", "POST"] },
});

(app as any).set("io", io);

io.use(async (socket, next) => {
  try {
    // Clerk session token passed as auth header from client
    const token = socket.handshake.auth?.token as string;
    if (!token) return next(new Error("Not authenticated"));

    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUserId = payload.sub;

    const user = await User.findOne({ clerkId: clerkUserId, isDeleted: false });
    if (!user || !user.isActive) return next(new Error("User not found"));
    if (user.role !== "admin") return next(new Error("Admins only"));

    (socket as any).user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  logger.info(`Socket connected: admin ${user.email}`);

  socket.on("join_admin_room", () => {
    socket.join("admin_room");
    logger.info(`Admin ${user.email} joined admin_room`);
  });

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${user.email}`);
  });
});

const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    startEmailWorker();
    httpServer.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
    });
  } catch (err: any) {
    console.error("FATAL: Server failed to start:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

startServer();

process.on("unhandledRejection", (err: any) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on("uncaughtException", (err: any) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
