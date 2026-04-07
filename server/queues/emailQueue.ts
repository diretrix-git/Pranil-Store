import { Queue, Worker, Job } from "bullmq";
import logger from "../utils/logger";
import {
  sendBuyerConfirmation,
  sendAdminNotification,
  sendOrderStatusUpdate,
} from "../utils/mailer";
import { IOrder } from "../types";

// BullMQ requires a real Redis connection (not HTTP) — use Upstash Redis with TLS
// Upstash provides a standard Redis-compatible endpoint alongside the REST API
const connection = {
  host: new URL(process.env.UPSTASH_REDIS_REST_URL || "redis://localhost").hostname,
  port: 6379,
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  tls: {},
};

export type EmailJobData =
  | { type: "order_placed"; order: IOrder }
  | { type: "order_status"; order: IOrder; newStatus: string };

export const emailQueue = new Queue<EmailJobData>("emails", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export function startEmailWorker(): void {
  const worker = new Worker<EmailJobData>(
    "emails",
    async (job: Job<EmailJobData>) => {
      const { data } = job;

      if (data.type === "order_placed") {
        await Promise.all([
          sendBuyerConfirmation(data.order),
          sendAdminNotification(data.order),
        ]);
        logger.info(`Email sent: order_placed ${(data.order as any).orderNumber}`);
      }

      if (data.type === "order_status") {
        const notifiable = ["pending", "confirmed", "completed", "cancelled"];
        if (notifiable.includes(data.newStatus)) {
          await sendOrderStatusUpdate(data.order, data.newStatus as any);
          logger.info(`Email sent: order_status ${(data.order as any).orderNumber} → ${data.newStatus}`);
        }
      }
    },
    { connection },
  );

  worker.on("failed", (job, err) => {
    logger.error(`Email job failed [${job?.id}]: ${err.message}`);
  });

  logger.info("Email queue worker started");
}
