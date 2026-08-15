import { getResendApiKey, getResendFromEmail, isResendApiKeyFormatValid } from "./env.js";

export function isResendConfigured() {
  return getResendApiKey().length > 0;
}

export function isResendApiKeyLooksValid() {
  return isResendApiKeyFormatValid();
}

export { getResendApiKey as getLiveResendApiKey, getResendFromEmail as getLiveResendFromEmail };
