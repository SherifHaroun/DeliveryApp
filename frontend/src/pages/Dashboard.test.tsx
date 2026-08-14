import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./Dashboard";

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
}));

import { api } from "../api/client";

const apiMock = vi.mocked(api);

describe("DashboardPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
    apiMock.mockResolvedValue({
      toBeDelivered: 18,
      delivered: 32,
      inCustody: 18,
      recentActivity: [
        {
          id: "a1",
          action: "DELIVERED",
          summary: "Card delivered",
          message: "Delivery completed",
          createdAt: new Date().toISOString(),
          last4: "0001",
          identifier: "C00001",
          customerName: "Ahmed Salem",
          status: "DELIVERED",
        },
      ],
    });
  });

  it("renders dashboard stats, recent activity, and how it works", async () => {
    render(<DashboardPage />);

    expect(await screen.findByText("Cards To Be Delivered")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Delivered Cards")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("C00001")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText(/Scan the QR code attached to the card/i)).toBeInTheDocument();
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/api/dashboard"));
  });
});
