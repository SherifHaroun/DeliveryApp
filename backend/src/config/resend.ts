/**
 * Demo-only Resend configuration.
 *
 * Paste the real key below for this demo. Later, replace this assignment with:
 *   process.env.RESEND_API_KEY
 * without changing OTP send/verify logic.
 */
const RESEND_API_KEY: string = "PASTE_RESEND_API_KEY_HERE";

const RESEND_FROM = "onboarding@resend.dev";

export { RESEND_API_KEY, RESEND_FROM };

export function isResendConfigured() {
  return RESEND_API_KEY !== "PASTE_RESEND_API_KEY_HERE" && RESEND_API_KEY.trim().length > 0;
}
