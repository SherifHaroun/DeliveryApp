import { Resend } from "resend";
import { isResendApiKeyFormatValid } from "../../config/env.js";
import { getLiveResendApiKey, getLiveResendFromEmail, isResendConfigured } from "../../config/resend.js";
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

function resendErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "unknown error";
  const record = error as { message?: unknown; name?: unknown };
  const message = typeof record.message === "string" ? record.message : "";
  const name = typeof record.name === "string" ? record.name : "";
  return [name, message].filter(Boolean).join(": ") || JSON.stringify(error);
}

export async function sendOtpEmail(message: OtpMessage): Promise<NotificationResult> {
  if (!isResendConfigured()) {
    console.error("OTP email failed: RESEND_API_KEY is missing on the backend.");
    throw new Error("RESEND_API_KEY is missing on Railway.");
  }

  const apiKey = getLiveResendApiKey();
  if (!isResendApiKeyFormatValid(apiKey)) {
    console.error("OTP email failed: RESEND_API_KEY is not a valid Resend key (should start with re_).");
    throw new Error("API key is invalid");
  }
  const from = getLiveResendFromEmail();
  const to = String(message.to ?? "").trim();
  console.info(`Sending OTP email from=${from} to=${to.replace(/^[^@]+/, "***")}`);
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Your Card Delivery Verification Code",
    text: emailBody(message.code),
    html: emailHtml(message.code),
  });

  if (error) {
    console.error("Failed to send OTP email:", resendErrorMessage(error));
    throw new Error(resendErrorMessage(error));
  }

  console.info("OTP email accepted by Resend:", data?.id ?? "no-id");
  return { channel: "EMAIL", sent: true };
}
