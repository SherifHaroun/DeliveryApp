import { getResendApiKey, getResendFromEmail } from "./env.js";

export function isResendConfigured() {
  return getResendApiKey().length > 0;
}

export { getResendApiKey as getLiveResendApiKey, getResendFromEmail as getLiveResendFromEmail };
