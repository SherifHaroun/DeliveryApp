import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
          cardId: "card-1",
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

  it("renders dashboard stats and recent activity", async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Cards To Be Delivered")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Delivered Cards")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Cards To Be Delivered/i })).toHaveAttribute("href", "/deliveries");
    expect(screen.getByRole("link", { name: /Delivered Cards/i })).toHaveAttribute("href", "/deliveries?status=DELIVERED");
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("C00001")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /C00001/i })).toHaveAttribute("href", "/deliveries/card-1");
    expect(screen.queryByText("Ready to Deliver")).not.toBeInTheDocument();
    expect(screen.queryByText("Scan a card to begin the delivery process.")).not.toBeInTheDocument();
    expect(screen.queryByText("How It Works")).not.toBeInTheDocument();
    expect(screen.queryByText(/Scan the QR code attached to the card/i)).not.toBeInTheDocument();
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith("/api/dashboard"));
  });

  it("shows each card identifier only once and links to the delivery details page", async () => {
    apiMock.mockResolvedValue({
      toBeDelivered: 1,
      delivered: 1,
      inCustody: 1,
      recentActivity: [
        {
          id: "evt-9-latest",
          cardId: "card-9",
          action: "TAKEN_INTO_CUSTODY",
          summary: "Card taken into custody",
          message: "C00009 in custody",
          createdAt: "2026-08-15T00:37:00.000Z",
          last4: "0009",
          identifier: "C00009",
          customerName: "Dina Magdy",
          status: "IN_CUSTODY",
        },
        {
          id: "evt-9-scan",
          cardId: "card-9",
          action: "QR_SCANNED",
          summary: "Card scanned",
          message: "Scanned C00009",
          createdAt: "2026-08-15T00:30:00.000Z",
          last4: "0009",
          identifier: "C00009",
          customerName: "Dina Magdy",
          status: "IN_CUSTODY",
        },
        {
          id: "evt-5-delivered",
          cardId: "card-5",
          action: "DELIVERED",
          summary: "Card delivered",
          message: "Delivery completed for C00005",
          createdAt: "2026-08-15T00:20:00.000Z",
          last4: "0005",
          identifier: "C00005",
          customerName: "Laila Mostafa",
          status: "DELIVERED",
        },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findAllByText("C00009")).toHaveLength(1);
    expect(screen.getAllByText("C00005")).toHaveLength(1);
    expect(screen.getByRole("link", { name: /C00009/i })).toHaveAttribute("href", "/deliveries/card-9");
    expect(screen.getByRole("link", { name: /C00005/i })).toHaveAttribute("href", "/deliveries/card-5");
    expect(screen.queryByText("Dina Magdy")).not.toBeInTheDocument();
    expect(screen.queryByText("Laila Mostafa")).not.toBeInTheDocument();
  });
});
