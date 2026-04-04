// Load env vars first — must be before any other require
require('dotenv').config();

const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

// ── HTTP server ───────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,   // never '*'
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

// Attach io to app so controllers can emit events
app.set('io', io);

// JWT auth middleware for Socket.io — only admins allowed
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split(';')
      .find((c) => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) return next(new Error('Not authenticated'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || user.isDeleted || !user.isActive) return next(new Error('User not found'));
    if (user.role !== 'admin') return next(new Error('Admins only'));

    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: admin ${socket.user.email}`);

  socket.on('join_admin_room', () => {
    socket.join('admin_room');
    logger.info(`Admin ${socket.user.email} joined admin_room`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.user.email}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});
