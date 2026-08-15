import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveryDetailPage } from "./DeliveryDetail";

vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "courier@example.com", fullName: "Karim Hassan", phone: null, role: "COURIER" },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("../api/client", () => ({
  api: vi.fn(),
  ApiError: class ApiError extends Error {
    status = 400;
    details = {};
  },
}));

import { api } from "../api/client";

const apiMock = vi.mocked(api);

describe("DeliveryDetailPage receipt", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({
      id: "card-1",
      identifier: "C00001",
      last4: "0001",
      cardType: "Debit",
      status: "DELIVERED",
      scannedAt: "2026-08-14T10:00:00.000Z",
      otpSentAt: "2026-08-14T10:05:00.000Z",
      deliveredAt: "2026-08-14T10:10:00.000Z",
      createdAt: "2026-08-14T09:00:00.000Z",
      updatedAt: "2026-08-14T10:10:00.000Z",
      customer: {
        id: "cust-1",
        fullName: "Ahmed Salem",
        email: "a*****@example.com",
        phone: null,
        address: "14 Nile Corniche",
        city: "Cairo",
      },
      courier: { id: "u1", fullName: "Karim Hassan", email: "courier@example.com" },
    });
  });

  it("renders the delivered receipt fields", async () => {
    render(
      <MemoryRouter initialEntries={["/deliveries/card-1"]}>
        <Routes>
          <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Card Delivered Successfully")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("C00001")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Ahmed Salem")).toBeInTheDocument();
    expect(screen.getByText("Delivered By")).toBeInTheDocument();
    expect(screen.getByText("Karim Hassan")).toBeInTheDocument();
    expect(screen.getByText("Date & Time")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Delivered ✓")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to Dashboard" })).toBeInTheDocument();
  });
});

const customer = {
  id: "cust-1",
  fullName: "Ahmed Nabil",
  email: "s*****@gmail.com",
  phone: null,
  address: "11 Port Said Street, Suez",
  city: "Suez",
};

const custodyCard = {
  id: "card-1",
  identifier: "C00010",
  last4: "0010",
  cardType: "Debit",
  status: "IN_CUSTODY" as const,
  scannedAt: "2026-08-15T01:00:00.000Z",
  otpSentAt: null,
  deliveredAt: null,
  createdAt: "2026-08-15T00:00:00.000Z",
  updatedAt: "2026-08-15T01:00:00.000Z",
  customer,
  courier: { id: "u1", fullName: "Karim Hassan", email: "courier@example.com" },
};

const otpSentCard = {
  ...custodyCard,
  status: "OTP_SENT" as const,
  otpSentAt: "2026-08-15T01:05:00.000Z",
  otp: {
    expiresAt: "2026-08-15T01:10:00.000Z",
    sentAt: "2026-08-15T01:05:00.000Z",
    attemptsRemaining: 5,
    resendAvailableAt: "2026-08-15T01:05:00.000Z",
    expired: false,
    locked: false,
    channel: "EMAIL" as const,
    destination: "s*****@gmail.com",
  },
};

function renderDetail() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={["/deliveries/card-1"]}>
        <Routes>
          <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  );
}

describe("DeliveryDetailPage send OTP", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("opens OTP verification after one Send OTP click and ignores a stale GET", async () => {
    const user = userEvent.setup();
    const pendingGets: Array<(value: unknown) => void> = [];
    let postCount = 0;

    apiMock.mockImplementation(async (path: string) => {
      if (String(path).includes("send-otp")) {
        postCount += 1;
        return { card: otpSentCard };
      }
      return new Promise((resolve) => {
        pendingGets.push(resolve);
      });
    });

    renderDetail();

    await waitFor(() => expect(pendingGets.length).toBeGreaterThanOrEqual(1));
    const latestGet = pendingGets.pop()!;
    const staleGets = [...pendingGets];
    latestGet(custodyCard);

    expect(await screen.findByRole("button", { name: "Send OTP" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send OTP" }));

    expect(await screen.findByText("OTP Verification")).toBeInTheDocument();
    expect(screen.getByText(/Enter the 6-digit code to verify/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send OTP" })).not.toBeInTheDocument();
    expect(postCount).toBe(1);

    staleGets.forEach((resolve) => resolve(custodyCard));
    await waitFor(() => expect(screen.getByText("OTP Verification")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Send OTP" })).not.toBeInTheDocument();
  });

  it("accepts a top-level send-otp payload and only sends one POST if clicked twice", async () => {
    const user = userEvent.setup();
    let postCount = 0;
    let finishPost: ((value: unknown) => void) | undefined;

    apiMock.mockImplementation(async (path: string) => {
      if (String(path).includes("send-otp")) {
        postCount += 1;
        return new Promise((resolve) => {
          finishPost = resolve;
        });
      }
      return custodyCard;
    });

    renderDetail();

    const button = await screen.findByRole("button", { name: "Send OTP" });
    await user.click(button);
    await user.click(button);
    expect(await screen.findByRole("button", { name: "Sending OTP..." })).toBeDisabled();
    expect(postCount).toBe(1);

    finishPost?.(otpSentCard);
    expect(await screen.findByText("OTP Verification")).toBeInTheDocument();
    expect(postCount).toBe(1);
  });
});
