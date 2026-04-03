const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/categories", require("./routes/categories"));
app.use("/api/v1/products", require("./routes/products"));
app.use("/api/v1/cart", require("./routes/cart"));
app.use("/api/v1/orders", require("./routes/orders"));
app.use("/api/v1/contact", require("./routes/contact"));
app.use("/api/v1/admin", require("./routes/admin"));

app.use(errorHandler);

module.exports = app;
