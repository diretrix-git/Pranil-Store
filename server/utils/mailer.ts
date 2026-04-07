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

export const sendBuyerConfirmation = async (order: IOrder): Promise<void> => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt } = order;

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${i.quantity} ${i.unit || "pcs"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">Rs. ${Number(i.price).toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">Rs. ${Number(i.subtotal).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Order Confirmed</h1>
      <p style="color:#c4b5fd;margin:8px 0 0;">${orderNumber}</p>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#334155;font-size:16px;">Hi <strong>${buyerSnapshot.name}</strong>,</p>
      <p style="color:#64748b;">Your order has been received and is being processed.</p>
      <p style="color:#64748b;font-size:14px;">Order date: ${new Date(createdAt).toLocaleDateString()}</p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Unit Price</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Subtotal</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr>
          <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;color:#1e293b;">Total</td>
          <td style="padding:12px;text-align:right;font-weight:bold;color:#7c3aed;font-size:18px;">Rs. ${Number(totalAmount).toFixed(2)}</td>
        </tr></tfoot>
      </table>
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">MarketHub — questions? Reply to this email.</p>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: buyerSnapshot.email,
    subject: `Order Confirmed — ${orderNumber}`,
    html,
  });
};

export const sendAdminNotification = async (order: IOrder): Promise<void> => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt, _id } = order;

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">Rs. ${Number(i.subtotal).toFixed(2)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">New Order Received</h1>
      <p style="color:#fca5a5;margin:8px 0 0;">${orderNumber}</p>
    </div>
    <div style="padding:32px 24px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Buyer</td><td style="padding:6px 0;font-weight:600;color:#1e293b;">${buyerSnapshot.name}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Phone</td><td style="padding:6px 0;color:#1e293b;">${buyerSnapshot.phone || "—"}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Email</td><td style="padding:6px 0;color:#1e293b;">${buyerSnapshot.email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Date</td><td style="padding:6px 0;color:#1e293b;">${new Date(createdAt).toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Order ID</td><td style="padding:6px 0;color:#94a3b8;font-size:12px;font-family:monospace;">${_id}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Subtotal</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot><tr>
          <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#1e293b;">Total</td>
          <td style="padding:12px;text-align:right;font-weight:bold;color:#dc2626;font-size:18px;">Rs. ${Number(totalAmount).toFixed(2)}</td>
        </tr></tfoot>
      </table>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Received — ${orderNumber}`,
    html,
  });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string): Promise<void> => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Reset Your Password</h1>
    </div>
    <div style="padding:32px 24px;">
      <p style="color:#334155;font-size:16px;">You requested a password reset for your MarketHub account.</p>
      <p style="color:#64748b;">Click the button below to set a new password. This link expires in <strong>15 minutes</strong>.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">Reset Password</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
      <p style="color:#94a3b8;font-size:12px;word-break:break-all;">Or copy this link: ${resetUrl}</p>
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">MarketHub — B2B Marketplace</p>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Password Reset — MarketHub",
    html,
  });
};
