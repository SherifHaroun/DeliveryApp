import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, getToken, setToken, setUnauthorizedHandler } from "./client";

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as Promise<Response>;
}

describe("api client session handling", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.clear();
    setToken("valid-token");
  });

  afterEach(() => {
    setUnauthorizedHandler(null);
    vi.unstubAllGlobals();
  });

  it("clears the session on 401", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockImplementation(() => jsonResponse(401, { error: "Session expired. Please sign in again." }));

    await expect(api("/api/dashboard")).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(getToken()).toBeNull();
  });

  it("does not log out on 403", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockImplementation(() =>
      jsonResponse(403, { error: "Cards can only be marked delivered after OTP verification." }),
    );

    await expect(api("/api/deliveries/1/deliver", { method: "POST" })).rejects.toMatchObject({ status: 403 });
    expect(handler).not.toHaveBeenCalled();
    expect(getToken()).toBe("valid-token");
  });

  it("does not log out on login 401", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockImplementation(() => jsonResponse(401, { error: "Invalid email or password" }));

    await expect(api("/api/auth/login", { method: "POST" })).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not log out on 500", async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    fetchMock.mockImplementation(() => jsonResponse(500, { error: "Something went wrong" }));

    await expect(api("/api/dashboard")).rejects.toMatchObject({ status: 500 });
    expect(handler).not.toHaveBeenCalled();
    expect(getToken()).toBe("valid-token");
  });
});
