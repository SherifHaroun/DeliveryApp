import { Resend } from "resend";
import { isResendConfigured, RESEND_API_KEY, RESEND_FROM_EMAIL } from "../../config/resend.js";
import type { NotificationResult, OtpMessage } from "./types.js";

function emailBody(code: string) {
  return [
    "Your verification code for your card delivery is:",
    "",
    code,
    "",
    "This code expires in 5 minutes.",
    "",
    "If you did not request this code, please ignore this email.",
    "",
    "Card Delivery Team",
  ].join("\n");
}

function emailHtml(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; color: #172033;">
      <p>Your verification code for your card delivery is:</p>
      <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #2563EB; margin: 24px 0;">
        ${code}
      </p>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this code, please ignore this email.</p>
      <p>Card Delivery Team</p>
    </div>
  `;
}

export async function sendOtpEmail(message: OtpMessage): Promise<NotificationResult> {
  if (!isResendConfigured()) {
    throw new Error("Resend is not configured.");
  }

  const resend = new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: message.to,
    subject: "Your Card Delivery Verification Code",
    text: emailBody(message.code),
    html: emailHtml(message.code),
  });

  if (error) {
    console.error("Failed to send OTP email:", error.message ?? "unknown error");
    throw new Error("Could not send OTP email.");
  }

  return { channel: "EMAIL", sent: true };
}
