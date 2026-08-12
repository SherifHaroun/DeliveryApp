import type { NotificationResult, OtpMessage } from "./types.js";

export async function sendOtpSms(_message: OtpMessage): Promise<NotificationResult> {
  throw new Error("SMS OTP delivery is not enabled yet.");
}
