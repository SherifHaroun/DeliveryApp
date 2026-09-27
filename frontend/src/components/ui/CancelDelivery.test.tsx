import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CancelDelivery } from "./CancelDelivery";
import { api } from "../../api/client";
vi.mock("../../api/client", () => ({ api: vi.fn() }));

describe("cancellation location capture", () => {
  const getCurrentPosition = vi.fn();
  beforeEach(() => {
    vi.mocked(api).mockReset(); getCurrentPosition.mockReset();
    Object.defineProperty(navigator, "geolocation", { configurable: true, value: { getCurrentPosition } });
  });
  async function open() {
    const onCancelled = vi.fn();
    render(<CancelDelivery cardId="card-1" disabled={false} onCancelled={onCancelled} onBusyChange={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Cancel delivery" }));
    await user.type(screen.getByLabelText("Cancellation reason"), "Customer unavailable");
    await user.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    return onCancelled;
  }
  it("posts fresh coordinates and accuracy with the cancellation reason", async () => {
    const timestamp = Date.now();
    getCurrentPosition.mockImplementation(success => success({ coords: { latitude: 30, longitude: 31, accuracy: 12 }, timestamp }));
    vi.mocked(api).mockResolvedValue({ id: "card-1", status: "CANCELLED" });
    const onCancelled = await open();
    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
    expect(JSON.parse(vi.mocked(api).mock.calls[0][1]!.body as string)).toEqual({ reason: "Customer unavailable", latitude: 30, longitude: 31, accuracy: 12, capturedAt: new Date(timestamp).toISOString() });
    expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({ maximumAge: 0, enableHighAccuracy: true });
  });
  it("keeps the delivery active when location permission is denied", async () => {
    getCurrentPosition.mockImplementation((_success, failure) => failure({ code: 1 }));
    await open();
    expect(await screen.findByRole("alert")).toHaveTextContent("Delivery has not been cancelled");
    expect(api).not.toHaveBeenCalled();
  });
});
