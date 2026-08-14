import { render, screen } from "@testing-library/react";
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
