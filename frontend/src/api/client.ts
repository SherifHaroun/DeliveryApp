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
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
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
    throw new ApiError(0, "API URL is not configured. Set VITE_API_URL to the Railway backend URL.");
  }

  const url = buildApiUrl(API_BASE, path);
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(0, "Unable to reach the Delivery API.");
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    throw new ApiError(response.status, String(data.error ?? "Request failed"), data);
  }

  return data as T;
}
