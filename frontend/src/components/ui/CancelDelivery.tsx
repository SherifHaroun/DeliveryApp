import { useRef, useState } from "react";
import { api } from "../../api/client";
import type { DeliveryCard } from "../../api/types";
import { formatWhen } from "../../lib/format";
import { Button } from "./Button";
import styles from "./CancelDelivery.module.css";

export function CancellationReceipt({ card }: { card: DeliveryCard }) {
  const details = card.cancellation;
  if (!details) return <p>No cancellation details available.</p>;
  return <section className={styles.receipt} aria-label="Cancellation details">
    <h2>Cancellation details</h2>
    <dl>
      <dt>Reason</dt><dd>{details.reason}</dd>
      <dt>Cancelled by</dt><dd>{details.courierName}</dd>
      <dt>Cancelled at</dt><dd>{formatWhen(details.cancelledAt)}</dd>
      <dt>Customer address</dt><dd>{details.customerAddress}, {details.customerCity}</dd>
      <dt>Courier location</dt><dd>{details.latitude.toFixed(6)}, {details.longitude.toFixed(6)}</dd>
      <dt>Location accuracy</dt><dd>Within approximately {Math.round(details.accuracy)} metres</dd>
      <dt>Location captured at</dt><dd>{formatWhen(details.capturedAt)}</dd>
    </dl>
    <a href={`https://www.google.com/maps?q=${details.latitude},${details.longitude}`} target="_blank" rel="noopener noreferrer">View cancellation location on map</a>
    <p>Compare this device-reported location with the customer address. Customer GPS coordinates are not available for an automatic distance comparison.</p>
  </section>;
}

export function CancelDelivery({ cardId, disabled, onCancelled, onBusyChange }: {
  onBusyChange: (busy: boolean) => void;
  cardId: string; disabled: boolean; onCancelled: (card: DeliveryCard) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function cancel() {
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true); onBusyChange(true); setError("");
    try {
      if (!navigator.geolocation) throw new Error("Location is unavailable on this device. Use a device with location access to cancel.");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error("Could not capture your location. Enable location permission and device location services, then retry. Delivery has not been cancelled.")), { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
      });
      const updated = await api<DeliveryCard>(`/api/deliveries/${cardId}/cancel`, { method: "POST", body: JSON.stringify({
        reason: reason.trim(), latitude: position.coords.latitude, longitude: position.coords.longitude,
        accuracy: position.coords.accuracy, capturedAt: new Date(position.timestamp).toISOString(),
      }) });
      onCancelled(updated);
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to cancel delivery."); }
    finally { lock.current = false; setBusy(false); onBusyChange(false); }
  }
  return <section className={styles.panel} aria-label="Cancel delivery">
    {!open ? <Button variant="ghost" block disabled={disabled} onClick={() => setOpen(true)}>Cancel delivery</Button> : <>
      <h2>Cancel this delivery?</h2>
      <p>Your current location, its accuracy, and the time will be saved with your reason for review. This ends the delivery and invalidates its OTP.</p>
      <label htmlFor="cancel-reason">Cancellation reason</label>
      <textarea id="cancel-reason" rows={3} maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} />
      {error ? <p className="banner-error" role="alert">{error}</p> : null}
      <Button block disabled={disabled || busy || !reason.trim()} loading={busy} onClick={() => void cancel()}>{busy ? "Capturing location and cancelling…" : "Confirm cancellation"}</Button>
      <Button variant="ghost" block disabled={busy} onClick={() => setOpen(false)}>Keep delivery</Button>
    </>}
  </section>;
}
