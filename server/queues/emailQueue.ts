/**
 * Email queue — simplified to direct async sending.
 *
 * BullMQ requires a TCP Redis connection which Upstash REST API doesn't provide.
 * Emails are sent fire-and-forget with Promise.all — non-blocking, errors are logged.
 */

import logger from "../utils/logger";
import {
  sendBuyerConfirmation,
  sendAdminNotification,
  sendOrderStatusUpdate,
} from "../utils/mailer";
import { IOrder } from "../types";

export type EmailJobData =
  | { type: "order_placed"; order: IOrder }
  | { type: "order_status"; order: IOrder; newStatus: string };

const NOTIFIABLE = new Set(["pending", "confirmed", "completed", "cancelled"]);

export function queueEmail(data: EmailJobData): void {
  if (data.type === "order_placed") {
    // Guard: skip buyer email if no email address captured in snapshot
    const tasks: Promise<void>[] = [sendAdminNotification(data.order)];
    if (data.order.buyerSnapshot?.email) {
      tasks.push(sendBuyerConfirmation(data.order));
    } else {
      logger.warn(`Order ${(data.order as any).orderNumber}: buyer has no email — skipping buyer confirmation`);
    }
    Promise.all(tasks).catch((err) => logger.error(`Email failed [order_placed ${(data.order as any).orderNumber}]: ${err.message}`));
  }

  if (data.type === "order_status" && NOTIFIABLE.has(data.newStatus)) {
    sendOrderStatusUpdate(data.order, data.newStatus as any)
      .catch((err) => logger.error(`Email failed [order_status ${(data.order as any).orderNumber} → ${data.newStatus}]: ${err.message}`));
  }
}

// No-op — kept so server.ts import doesn't break
export function startEmailWorker(): void {
  logger.info("Email sending: direct async (no queue)");
}
