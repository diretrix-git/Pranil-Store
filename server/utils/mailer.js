/**
 * Nodemailer transporter using Gmail App Password.
 *
 * Prerequisites:
 *  1. Enable 2FA on the Gmail account.
 *  2. Generate an App Password: Google Account → Security → App Passwords.
 *  3. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.
 *
 * Volume note:
 *  Gmail limits transactional sending to ~500 emails/day.
 *  For higher volume, swap this transporter for Resend (resend.com)
 *  or SendGrid — both have free tiers and better deliverability.
 */

const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = `"${process.env.GMAIL_FROM_NAME || 'MarketHub'}" <${process.env.GMAIL_USER}>`;

// ── Buyer confirmation email ──────────────────────────────────────────────────

const sendBuyerConfirmation = async (order) => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt } = order;

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${i.quantity} ${i.unit || 'pcs'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">$${Number(i.price).toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">$${Number(i.subtotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const itemsText = items
    .map((i) => `  - ${i.name} x${i.quantity} @ $${Number(i.price).toFixed(2)} = $${Number(i.subtotal).toFixed(2)}`)
    .join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
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
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:12px;text-align:right;font-weight:bold;color:#1e293b;">Total</td>
            <td style="padding:12px;text-align:right;font-weight:bold;color:#7c3aed;font-size:18px;">$${Number(totalAmount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="color:#64748b;font-size:14px;">You can print your invoice by logging into your account and visiting My Orders.</p>
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">MarketHub — questions? Reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `Hi ${buyerSnapshot.name},\n\nYour order ${orderNumber} has been confirmed.\n\nItems:\n${itemsText}\n\nTotal: $${Number(totalAmount).toFixed(2)}\n\nLog in to your account to print your invoice.\n\n— MarketHub`;

  return transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: buyerSnapshot.email,
    subject: `Order Confirmed — ${orderNumber}`,
    text,
    html,
  });
};

// ── Admin notification email ──────────────────────────────────────────────────

const sendAdminNotification = async (order) => {
  const { buyerSnapshot, orderNumber, items, totalAmount, createdAt, _id } = order;

  const itemsText = items
    .map((i) => `  - ${i.name} x${i.quantity} @ $${Number(i.price).toFixed(2)} = $${Number(i.subtotal).toFixed(2)}`)
    .join('\n');

  const itemRows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${i.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">$${Number(i.subtotal).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">New Order Received</h1>
      <p style="color:#fca5a5;margin:8px 0 0;">${orderNumber}</p>
    </div>
    <div style="padding:32px 24px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Buyer</td><td style="padding:6px 0;font-weight:600;color:#1e293b;">${buyerSnapshot.name}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Phone</td><td style="padding:6px 0;color:#1e293b;">${buyerSnapshot.phone || '—'}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Email</td><td style="padding:6px 0;color:#1e293b;">${buyerSnapshot.email}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Date</td><td style="padding:6px 0;color:#1e293b;">${new Date(createdAt).toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b;font-size:14px;">Order ID</td><td style="padding:6px 0;color:#94a3b8;font-size:12px;font-family:monospace;">${_id}</td></tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;">Product</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px;text-align:right;font-weight:bold;color:#1e293b;">Total</td>
            <td style="padding:12px;text-align:right;font-weight:bold;color:#dc2626;font-size:18px;">$${Number(totalAmount).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <p style="color:#64748b;font-size:14px;">Log in to the dashboard to update the order status.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `New order received: ${orderNumber}\n\nBuyer: ${buyerSnapshot.name}\nPhone: ${buyerSnapshot.phone || '—'}\nEmail: ${buyerSnapshot.email}\nDate: ${new Date(createdAt).toLocaleString()}\n\nItems:\n${itemsText}\n\nTotal: $${Number(totalAmount).toFixed(2)}\n\nLog in to the dashboard to update the order status.`;

  return transporter.sendMail({
    from: FROM,
    replyTo: FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Received — ${orderNumber}`,
    text,
    html,
  });
};

module.exports = { sendBuyerConfirmation, sendAdminNotification };
