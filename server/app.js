const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS — strict config, never use origin: '*'
const allowedOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// 3. Body parsing with 10kb limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Cookie parser
app.use(cookieParser());

// 5. Mongo sanitize — strip $ and . from request bodies
app.use(mongoSanitize());

// 6. HTTP parameter pollution prevention
app.use(hpp());

// 7. HTTP request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes — /api/v1
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/suppliers', require('./routes/suppliers'));
app.use('/api/v1/cart', require('./routes/cart'));
app.use('/api/v1/orders', require('./routes/orders'));
app.use('/api/v1/stores', require('./routes/stores'));
app.use('/api/v1/admin', require('./routes/admin'));

// Global error handler — MUST be last
app.use(errorHandler);

module.exports = app;
