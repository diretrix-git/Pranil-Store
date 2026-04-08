"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const hpp_1 = __importDefault(require("hpp"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
const allowedOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], allowedHeaders: ["Content-Type", "Authorization"] }));
app.use(express_1.default.json({ limit: "10kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10kb" }));
app.use((0, cookie_parser_1.default)());
app.use((0, express_mongo_sanitize_1.default)());
app.use((0, hpp_1.default)());
if (process.env.NODE_ENV === "development")
    app.use((0, morgan_1.default)("dev"));
// Global rate limit — 200 req/min per IP
app.use(rateLimiter_1.generalLimiter);
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const vendors_1 = __importDefault(require("./routes/vendors"));
const products_1 = __importDefault(require("./routes/products"));
const cart_1 = __importDefault(require("./routes/cart"));
const orders_1 = __importDefault(require("./routes/orders"));
const contact_1 = __importDefault(require("./routes/contact"));
const admin_1 = __importDefault(require("./routes/admin"));
app.use("/api/v1/auth", auth_1.default);
app.use("/api/v1/categories", categories_1.default);
app.use("/api/v1/vendors", vendors_1.default);
app.use("/api/v1/products", products_1.default);
app.use("/api/v1/cart", cart_1.default);
app.use("/api/v1/orders", orders_1.default);
app.use("/api/v1/contact", contact_1.default);
app.use("/api/v1/admin", admin_1.default);
app.use(errorHandler_1.default);
exports.default = app;
