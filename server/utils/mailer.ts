import nodemailer from "nodemailer";
import logger from "./logger";
import { IOrder } from "../types";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"${process.env.GMAIL_FROM_NAME || "MarketHub"}" <${process.env.GMAIL_USER}>`;

// ── Shared helpers ────────────────────────────────────────────────────────────

const emailWrapper = (headerBg: string, headerContent: string, body: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:${headerBg};padding:36px 32px;text-align:center;">
          ${headerContent}
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 32px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">© ${new Date().getFullYear()} MarketHub · B2B Marketplace</p>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:11px;">This is an automated message. Please do not reply directly.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const itemTable = (items: IOrder["items"]) => `
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
  <thead>
    <tr style="background:#f8fafc;">
      <th style="padding:10px 14px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Product</th>
      <th style="padding:10px 14px;text-align:center;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Qty</th>
      <th style="padding:10px 14px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Unit Price</th>
      <th style="padding:10px 14px;text-align:right;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Subtotal</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((i, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
      <td style="padding:10px 14px;font-size:14px;color:#1e293b;">${i.name}</td>
      <td style="padding:10px 14px;text-align:center;font-size:14px;color:#475569;">${i.quantity} ${i.unit || "pcs"}</td>
      <td style="padding:10px 14px;text-align:right;font-size:14px;color:#475569;">Rs. ${Number(i.price).toFixed(2)}</td>
      <td style="padding:10px 14px;text-align:right;font-size:14px;color:#1e293b;font-weight:600;">Rs. ${Number(i.subtotal).toFixed(2)}</td>
    </tr>`).join("")}
  </tbody>
  <tfoot>
    <tr style="background:#f8fafc;border-top:2px solid #e2e8f0;">
      <td colspan="3" style="padding:12px 14px;text-align:right;font-weight:700;color:#1e293b;font-size:14px;">Order Total</td>
      <td style="padding:12px 14px;text-align:right;font-weight:800;color:#7c3aed;font-size:18px;">Rs. ${Number(items.reduce((s, i) => s + i.subtotal, 0)).toFixed(2)}</td>
    </tr>
  </tfoot>
</table>`;

// ── Order placed — buyer confirmation ─────────────────────────────────────────

export const sendBuyerConfirmation = async (order: IOrder): Promise<void> => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt } = order;

  const header = `
    <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:28px;">🛍️</div>
    <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Order Received</h1>
    <p style="color:#c4b5fd;margin:8px 0 0;font-size:15px;font-weight:500;">${orderNumber}</p>`;

  const body = `
    <p style="color:#334155;font-size:16px;margin:0 0 8px;">Dear <strong>${buyerSnapshot.name}</strong>,</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6;">Thank you for your order. We have received it and it is now being reviewed. You will receive further updates as your order progresses.</p>
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Order Number</td>
          <td style="font-size:13px;color:#1e293b;font-weight:700;text-align:right;font-family:monospace;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Order Date</td>
          <td style="font-size:13px;color:#1e293b;text-align:right;">${new Date(createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Status</td>
          <td style="text-align:right;"><span style="background:#fef3c7;color:#92400e;font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">Pending Review</span></td>
        </tr>
      </table>
    </div>
    ${itemTable(items)}
    <p style="color:#64748b;font-size:13px;margin:24px 0 0;line-height:1.6;">If you have any questions about your order, please contact our support team by replying to this email.</p>`;

  await transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: buyerSnapshot.email,
    subject: `Order Received — ${orderNumber} | MarketHub`,
    html: emailWrapper("linear-gradient(135deg,#7c3aed,#4f46e5)", header, body),
  });
};

// ── Order status update — buyer notification ──────────────────────────────────

type NotifiableStatus = "pending" | "confirmed" | "completed" | "cancelled";

const STATUS_CONFIG: Record<NotifiableStatus, { label: string; badge: string; badgeBg: string; badgeColor: string; headerBg: string; icon: string; message: string }> = {
  pending: {
    label: "Order Pending",
    badge: "Pending Review",
    badgeBg: "#fef3c7", badgeColor: "#92400e",
    headerBg: "linear-gradient(135deg,#f59e0b,#d97706)",
    icon: "⏳",
    message: "Your order is pending review. Our team will confirm it shortly.",
  },
  confirmed: {
    label: "Order Confirmed",
    badge: "Confirmed",
    badgeBg: "#dbeafe", badgeColor: "#1e40af",
    headerBg: "linear-gradient(135deg,#3b82f6,#2563eb)",
    icon: "✅",
    message: "Great news! Your order has been confirmed and is being prepared for fulfillment.",
  },
  completed: {
    label: "Order Completed",
    badge: "Completed",
    badgeBg: "#dcfce7", badgeColor: "#166534",
    headerBg: "linear-gradient(135deg,#16a34a,#15803d)",
    icon: "🎉",
    message: "Your order has been successfully completed. Thank you for choosing MarketHub!",
  },
  cancelled: {
    label: "Order Cancelled",
    badge: "Cancelled",
    badgeBg: "#fee2e2", badgeColor: "#991b1b",
    headerBg: "linear-gradient(135deg,#dc2626,#b91c1c)",
    icon: "❌",
    message: "Your order has been cancelled. If you believe this is an error or have questions, please contact our support team.",
  },
};

export const sendOrderStatusUpdate = async (order: IOrder, newStatus: NotifiableStatus): Promise<void> => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt } = order;
  const cfg = STATUS_CONFIG[newStatus];

  const header = `
    <div style="font-size:36px;margin-bottom:12px;">${cfg.icon}</div>
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;">${cfg.label}</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:15px;">${orderNumber}</p>`;

  const body = `
    <p style="color:#334155;font-size:16px;margin:0 0 8px;">Dear <strong>${buyerSnapshot.name}</strong>,</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.6;">${cfg.message}</p>
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Order Number</td>
          <td style="font-size:13px;color:#1e293b;font-weight:700;text-align:right;font-family:monospace;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Order Date</td>
          <td style="font-size:13px;color:#1e293b;text-align:right;">${new Date(createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Updated Status</td>
          <td style="text-align:right;"><span style="background:${cfg.badgeBg};color:${cfg.badgeColor};font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;">${cfg.badge}</span></td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#64748b;padding:4px 0;">Order Total</td>
          <td style="font-size:14px;color:#7c3aed;font-weight:800;text-align:right;">Rs. ${Number(totalAmount).toFixed(2)}</td>
        </tr>
      </table>
    </div>
    ${itemTable(items)}
    ${newStatus === "cancelled" ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-top:20px;"><p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">If you did not request this cancellation or have concerns, please contact us immediately by replying to this email.</p></div>` : ""}
    ${newStatus === "completed" ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-top:20px;text-align:center;"><p style="margin:0;color:#166534;font-size:14px;font-weight:600;">Thank you for your business. We look forward to serving you again.</p></div>` : ""}`;

  await transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: buyerSnapshot.email,
    subject: `${cfg.label} — ${orderNumber} | MarketHub`,
    html: emailWrapper(cfg.headerBg, header, body),
  });
};

// ── New order — admin notification ────────────────────────────────────────────

export const sendAdminNotification = async (order: IOrder): Promise<void> => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt, _id } = order;

  const header = `
    <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;">New Order Received</h1>
    <p style="color:#fca5a5;margin:8px 0 0;font-size:15px;">${orderNumber}</p>`;

  const body = `
    <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Buyer</td><td style="padding:4px 0;font-size:13px;color:#1e293b;font-weight:700;text-align:right;">${buyerSnapshot.name}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Phone</td><td style="padding:4px 0;font-size:13px;color:#1e293b;text-align:right;">${buyerSnapshot.phone || "—"}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Email</td><td style="padding:4px 0;font-size:13px;color:#1e293b;text-align:right;">${buyerSnapshot.email}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Date</td><td style="padding:4px 0;font-size:13px;color:#1e293b;text-align:right;">${new Date(createdAt).toLocaleString()}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#64748b;">Order ID</td><td style="padding:4px 0;font-size:11px;color:#94a3b8;text-align:right;font-family:monospace;">${_id}</td></tr>
      </table>
    </div>
    ${itemTable(items)}`;

  await transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order — ${orderNumber} | MarketHub`,
    html: emailWrapper("linear-gradient(135deg,#dc2626,#b91c1c)", header, body),
  });
};

// ── Password reset ────────────────────────────────────────────────────────────

export const sendPasswordResetEmail = async (email: string, resetUrl: string): Promise<void> => {
  const header = `
    <div style="font-size:36px;margin-bottom:12px;">🔐</div>
    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;">Reset Your Password</h1>
    <p style="color:#c4b5fd;margin:8px 0 0;font-size:14px;">This link expires in 15 minutes</p>`;

  const body = `
    <p style="color:#334155;font-size:15px;margin:0 0 16px;">You requested a password reset for your MarketHub account.</p>
    <p style="color:#64748b;font-size:14px;margin:0 0 28px;line-height:1.6;">Click the button below to set a new password. If you did not request this, you can safely ignore this email.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">Reset Password</a>
    </div>
    <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;word-break:break-all;">Or copy this link: <a href="${resetUrl}" style="color:#7c3aed;">${resetUrl}</a></p>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Password Reset Request — MarketHub",
    html: emailWrapper("linear-gradient(135deg,#7c3aed,#4f46e5)", header, body),
  });
};
