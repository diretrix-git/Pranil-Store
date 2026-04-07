import "dotenv/config";
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

import http from "http";
import { Server } from "socket.io";
import { createClerkClient, verifyToken } from "@clerk/express";
import app from "./app";
import connectDB from "./config/db";
import logger from "./utils/logger";
import User from "./models/User";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const PORT = process.env.PORT || 5000;

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
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
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
