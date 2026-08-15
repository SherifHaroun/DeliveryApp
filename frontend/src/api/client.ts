const TOKEN_KEY = "delivery_token";

export function buildApiUrl(rawBase: string | undefined, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let base = String(rawBase ?? "").trim().replace(/\/+$/, "");

  if (!base) {
    return normalizedPath;
  }

  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }

  return new URL(normalizedPath, `${base}/`).toString();
}

const API_BASE = String(import.meta.env.VITE_API_URL ?? "").trim();

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  unauthorizedHandled = false;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;
let unauthorizedHandled = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

function notifyUnauthorized() {
  if (unauthorizedHandled) return;
  unauthorizedHandled = true;
  clearToken();
  onUnauthorized?.();
}

export class ApiError extends Error {
  status: number;
  details: Record<string, unknown>;

  constructor(status: number, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (import.meta.env.PROD && !API_BASE) {
    throw new ApiError(0, "Unable to connect to the server. Please try again.");
  }

  const url = buildApiUrl(API_BASE, path);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    console.error("API request failed", path, error);
    throw new ApiError(0, "Unable to connect to the server. Please try again.");
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const raw = String(data.error ?? "");
    console.error("API error", path, response.status, raw || data);
    if (response.status === 401 && !path.includes("/auth/login")) {
      notifyUnauthorized();
    }
    throw new ApiError(response.status, friendlyError(path, response.status, raw), data);
  }

  return data as T;
}

function friendlyError(path: string, status: number, message: string) {
  if (status === 401 && path.includes("/auth/login")) {
    return "Invalid email or password.";
  }
  if (path.includes("/auth/login") && (status === 0 || status >= 500)) {
    return "Unable to reach the server. Make sure the API is running.";
  }
  if (status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (path.includes("send-otp") && status >= 500) {
    if (/resend|email|configured|unable to send/i.test(message)) {
      return message;
    }
    return "Unable to send the OTP email. Check RESEND_API_KEY on Railway.";
  }
  if (path.includes("verify-otp") && /invalid|expired|used|attempt|6-digit/i.test(message)) {
    return message;
  }
  if (
    /card not found|invalid or the card|already been delivered|another courier|wait before|too many|enter the 6-digit|send an otp|already in custody|not found|incorrect|expired/i.test(
      message,
    )
  ) {
    return message;
  }
  if (status >= 500) {
    return "Something went wrong. Please try again.";
  }
  return message || "Something went wrong. Please try again.";
}
