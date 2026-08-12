import nodemailer from "nodemailer";
import type { NotificationResult, OtpMessage } from "./types.js";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM ?? "Card Delivery <noreply@delivery.local>";

function smtpConfigured() {
  return Boolean(host && user && pass);
}

function transporter() {
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendOtpEmail(message: OtpMessage): Promise<NotificationResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; color: #0f172a;">
      <h2 style="color: #0b1f3a; margin-bottom: 8px;">Card delivery confirmation</h2>
      <p>Hello ${message.customerName},</p>
      <p>Your courier is delivering your bank card ending in <strong>${message.last4}</strong> (${message.cardIdentifier}).</p>
      <p>Please give this one-time code to the courier to confirm you received the card:</p>
      <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #1d4ed8; margin: 24px 0;">
        ${message.code}
      </p>
      <p style="color: #64748b; font-size: 14px;">This code expires in ${message.expiresInMinutes} minutes. Do not share it with anyone except the courier at your door.</p>
    </div>
  `;

  if (!smtpConfigured()) {
    console.log(
      `[OTP][EMAIL] SMTP not configured — customer inbox skipped. to=${message.to} card=${message.cardIdentifier} code=${message.code}`,
    );
    return { channel: "EMAIL", sent: true };
  }

  await transporter().sendMail({
    from,
    to: message.to,
    subject: `Your card delivery code (${message.cardIdentifier})`,
    html,
    text: `Your card delivery code for ${message.cardIdentifier} is ${message.code}. It expires in ${message.expiresInMinutes} minutes.`,
  });

  return { channel: "EMAIL", sent: true };
}
