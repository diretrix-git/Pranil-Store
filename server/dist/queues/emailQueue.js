"use strict";
/**
 * Email queue — simplified to direct async sending.
 *
 * BullMQ requires a TCP Redis connection which Upstash REST API doesn't provide.
 * Emails are sent fire-and-forget with Promise.all — non-blocking, errors are logged.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueEmail = queueEmail;
exports.startEmailWorker = startEmailWorker;
const logger_1 = __importDefault(require("../utils/logger"));
const mailer_1 = require("../utils/mailer");
const NOTIFIABLE = new Set(["pending", "confirmed", "completed", "cancelled"]);
function queueEmail(data) {
    if (data.type === "order_placed") {
        // Guard: skip buyer email if no email address captured in snapshot
        const tasks = [(0, mailer_1.sendAdminNotification)(data.order)];
        if (data.order.buyerSnapshot?.email) {
            tasks.push((0, mailer_1.sendBuyerConfirmation)(data.order));
        }
        else {
            logger_1.default.warn(`Order ${data.order.orderNumber}: buyer has no email — skipping buyer confirmation`);
        }
        Promise.all(tasks).catch((err) => logger_1.default.error(`Email failed [order_placed ${data.order.orderNumber}]: ${err.message}`));
    }
    if (data.type === "order_status" && NOTIFIABLE.has(data.newStatus)) {
        (0, mailer_1.sendOrderStatusUpdate)(data.order, data.newStatus)
            .catch((err) => logger_1.default.error(`Email failed [order_status ${data.order.orderNumber} → ${data.newStatus}]: ${err.message}`));
    }
}
// No-op — kept so server.ts import doesn't break
function startEmailWorker() {
    logger_1.default.info("Email sending: direct async (no queue)");
}
