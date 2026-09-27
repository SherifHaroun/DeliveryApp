import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { api } from "../api/client";
import { ScanPage } from "./Scan";
import { DeliveryDetailPage } from "./DeliveryDetail";

const scanner = vi.hoisted(() => ({ decoded: undefined as undefined | ((value: string) => void) }));
vi.mock("html5-qrcode", () => ({
  Html5QrcodeSupportedFormats: { QR_CODE: 0 },
  Html5Qrcode: class {
    isScanning = true;
    async start(_camera: unknown, _config: unknown, decoded: (value: string) => void) { scanner.decoded = decoded; }
    async stop() { this.isScanning = false; }
  },
}));
vi.mock("../api/client", () => ({ api: vi.fn(), ApiError: class extends Error {} }));
vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ user: { fullName: "Courier" } }) }));
vi.mock("../theme/ScanPrefsContext", () => ({ useScanPrefs: () => ({ prefs: {} }), playScanFeedback: vi.fn() }));

const card = {
  id: "test-card", identifier: "C00011", status: "IN_CUSTODY", last4: "0011", cardType: "Debit",
  customer: { fullName: "Test Customer", email: "t*****@example.com" },
};
const sent = { ...card, status: "OTP_SENT", otp: {
  expiresAt: new Date(Date.now() + 300000).toISOString(), resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
  expired: false, locked: false, destination: "t*****@example.com",
} };

beforeEach(() => { vi.mocked(api).mockReset(); scanner.decoded = undefined; });

async function scan(alreadyInCustody = false, existingOtp = false, failure = false) {
  vi.mocked(api).mockImplementation(async path => {
    if (path === "/api/scan/custody") return { card: existingOtp ? sent : card, alreadyInCustody };
    if (path.endsWith("/send-otp")) {
      if (failure) throw new Error("Unable to send the OTP email.");
      return { card: sent };
    }
    return existingOtp ? sent : card;
  });
  render(<StrictMode><MemoryRouter initialEntries={["/scan"]}><Routes>
    <Route path="/scan" element={<ScanPage />} />
    <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
  </Routes></MemoryRouter></StrictMode>);
  await waitFor(() => expect(scanner.decoded).toBeDefined());
  await act(async () => { scanner.decoded!("C00011"); });
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: existingOtp ? "Enter OTP" : "Send OTP" }));
}

it.each([false, true])("one click after scanning opens OTP entry (repeat scan: %s)", async alreadyScanned => {
  await scan(alreadyScanned);
  expect(await screen.findByRole("button", { name: "Verify OTP" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Send OTP" })).not.toBeInTheDocument();
  expect(vi.mocked(api).mock.calls.filter(([path]) => path.endsWith("/send-otp"))).toHaveLength(1);
});

it("opens the existing OTP without sending a duplicate", async () => {
  await scan(true, true);
  expect(await screen.findByRole("button", { name: "Verify OTP" })).toBeInTheDocument();
  expect(vi.mocked(api).mock.calls.filter(([path]) => path.endsWith("/send-otp"))).toHaveLength(0);
});

it("shows an email failure and lets the courier retry", async () => {
  await scan(false, false, true);
  expect(await screen.findByText("Unable to send the OTP email.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send OTP" })).toBeEnabled();
  expect(screen.queryByRole("button", { name: "Verify OTP" })).not.toBeInTheDocument();
});
