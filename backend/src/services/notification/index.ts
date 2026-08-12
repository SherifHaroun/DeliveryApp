import { sendOtpEmail } from "./email.js";
import { sendOtpSms } from "./sms.js";
import type { NotificationResult, OtpMessage } from "./types.js";

export type { NotificationChannel, NotificationResult, OtpMessage } from "./types.js";

export async function sendOtpNotification(message: OtpMessage): Promise<NotificationResult> {
  if (message.channel === "SMS") {
    return sendOtpSms(message);
  }

  return sendOtpEmail(message);
}
