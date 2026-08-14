import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryPage } from "./History";

vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

import { api } from "../api/client";

const apiMock = vi.mocked(api);

describe("HistoryPage", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("renders activity from the history API", async () => {
    apiMock.mockResolvedValueOnce([
      {
        id: "e1",
        action: "TAKEN_INTO_CUSTODY",
        actionLabel: "Card Taken Into Custody",
        message: "Card C00001 taken into custody",
        createdAt: new Date().toISOString(),
        cardId: "card-1",
        cardIdentifier: "C00001",
        customerName: "Ahmed Salem",
        courierName: "Karim Hassan",
        status: "IN_CUSTODY",
        statusLabel: "In Custody",
      },
    ]);

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("C00001")).toBeInTheDocument();
    expect(screen.getByText("Card Taken Into Custody")).toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith("/api/history");
  });

  it("loads delivered cards when the Delivered tab is selected", async () => {
    apiMock.mockResolvedValueOnce([]);
    apiMock.mockResolvedValueOnce([
      {
        id: "card-2",
        identifier: "C00002",
        last4: "0002",
        cardType: "Debit",
        status: "DELIVERED",
        scannedAt: null,
        otpSentAt: null,
        deliveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        customer: {
          id: "c2",
          fullName: "Omar Farouk",
          email: "o*****@example.com",
          phone: null,
          address: "On file",
          city: null,
        },
        courier: null,
      },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("No Activity Yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delivered" }));
    expect(await screen.findByText("C00002")).toBeInTheDocument();
    expect(apiMock).toHaveBeenCalledWith("/api/deliveries?status=DELIVERED&sort=updated&dir=desc");
  });

  it("shows the history error state", async () => {
    apiMock.mockRejectedValueOnce(new Error("network"));

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Unable to Load History")).toBeInTheDocument();
    expect(screen.getByText("Please try again.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
