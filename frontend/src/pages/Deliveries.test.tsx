import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeliveriesPage } from "./Deliveries";

vi.mock("../api/client", () => ({
  api: vi.fn(),
}));

import { api } from "../api/client";

const apiMock = vi.mocked(api);

const card = {
  id: "card-1",
  identifier: "C10001",
  last4: "0001",
  cardType: "Debit",
  status: "IN_CUSTODY" as const,
  scannedAt: new Date().toISOString(),
  otpSentAt: null,
  deliveredAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customer: {
    id: "cust-1",
    fullName: "Nour El-Sayed",
    email: "n*****@example.com",
    phone: null,
    address: "On file",
    city: "Cairo",
  },
  courier: null,
};

describe("DeliveriesPage search", () => {
  beforeEach(() => {
    apiMock.mockReset();
  });

  it("renders a search field and results from the API", async () => {
    apiMock.mockResolvedValue([card]);

    render(
      <MemoryRouter>
        <DeliveriesPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Search deliveries")).toBeInTheDocument();
    expect(await screen.findByText("C10001")).toBeInTheDocument();
  });

  it("debounces search and shows an empty state when nothing matches", async () => {
    apiMock.mockResolvedValueOnce([card]);
    apiMock.mockResolvedValue([]);

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DeliveriesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("C10001")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search deliveries"), "NO-MATCH");

    await waitFor(
      () => {
        expect(apiMock).toHaveBeenCalledWith(expect.stringContaining("q=NO-MATCH"));
      },
      { timeout: 1500 },
    );
    expect(await screen.findByText("No Cards Found")).toBeInTheDocument();
  });
});
