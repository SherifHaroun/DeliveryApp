import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "../api/client";
import type { DeliveryCard as DeliveryCardType } from "../api/types";
import { Button } from "../components/ui/Button";
import { CardFacts } from "../components/ui/CardFacts";
import { Countdown } from "../components/ui/Countdown";
import { formatWhen, maskEmail } from "../lib/format";
import { WorkflowSteps, workflowIndex } from "../components/ui/WorkflowSteps";
import styles from "./DeliveryDetail.module.css";

export function DeliveryDetailPage() {
  const { id } = useParams();
  const [card, setCard] = useState<DeliveryCardType | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await api<DeliveryCardType>(`/api/deliveries/${id}`);
    setCard(data);
  }, [id]);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  async function sendOtp() {
    if (!id) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await api<{ card: DeliveryCardType }>(`/api/deliveries/${id}/send-otp`, {
        method: "POST",
      });
      setCard(result.card);
      setCode("");
      setMessage(`OTP sent to ${result.card.otp?.destination ?? maskEmail(result.card.customer.email)}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api<DeliveryCardType>(`/api/deliveries/${id}/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCard(updated);
      setCode("");
      setMessage("OTP verified. Card is now delivered.");
    } catch (err) {
      if (err instanceof ApiError) {
        const remaining = err.details.attemptsRemaining;
        setError(
          typeof remaining === "number"
            ? `${err.message} ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : err.message,
        );
        await load().catch(() => undefined);
      } else {
        setError("Could not verify OTP");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!card && !error) {
    return <p className={styles.muted}>Loading delivery…</p>;
  }

  if (!card) {
    return <p className={styles.error}>{error}</p>;
  }

  const otp = card.otp;
  const destination = otp?.destination ?? maskEmail(card.customer.email);
  const canResend =
    !otp || otp.expired || otp.locked || new Date(otp.resendAvailableAt).getTime() <= Date.now();

  return (
    <div>
      <Link to="/deliveries" className={styles.back}>
        <ArrowLeft size={16} /> Deliveries
      </Link>

      <header className={styles.header}>
        <div>
          <h1>{card.customer.fullName}</h1>
          <p>{card.identifier}</p>
        </div>
      </header>

      <WorkflowSteps current={workflowIndex(card.status)} />

      <section className={styles.card}>
        <CardFacts
          card={card}
          timestamp={card.status === "DELIVERED" ? card.deliveredAt : card.scannedAt}
        />
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}

      {card.status === "DELIVERED" ? (
        <section className={styles.done}>
          <h2>Delivered</h2>
          <p>Confirmed {formatWhen(card.deliveredAt)}</p>
        </section>
      ) : null}

      {card.status === "IN_CUSTODY" ? (
        <section className={styles.actions}>
          <p className={styles.hint}>
            Deliver the card in person, then send an OTP to {destination}.
          </p>
          <Button variant="warning" block disabled={busy} onClick={() => void sendOtp()}>
            {busy ? "Sending…" : "Send OTP to Customer"}
          </Button>
        </section>
      ) : null}

      {card.status === "OTP_SENT" ? (
        <section className={styles.actions}>
          <p className={styles.sentNote}>OTP sent to {destination}</p>
          <p className={styles.countdown}>
            {otp?.expired || !otp ? (
              "OTP expired. Send a new OTP."
            ) : (
              <>
                Expires in{" "}
                <Countdown
                  until={otp.expiresAt}
                  expiredLabel="0:00"
                  onExpire={() => setTick((value) => value + 1)}
                />
              </>
            )}
          </p>
          {otp && !otp.expired && !otp.locked ? (
            <p className={styles.hint}>{otp.attemptsRemaining} attempts remaining</p>
          ) : null}

          <form className={styles.otpForm} onSubmit={verifyOtp}>
            <label>
              Enter Customer OTP
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </label>
            <Button
              type="submit"
              variant="success"
              block
              disabled={busy || code.length !== 6 || Boolean(otp?.expired) || Boolean(otp?.locked)}
            >
              Verify OTP
            </Button>
          </form>

          <Button variant="ghost" block disabled={busy || !canResend} onClick={() => void sendOtp()}>
            {!canResend && otp ? (
              <>
                Resend OTP in{" "}
                <Countdown
                  until={otp.resendAvailableAt}
                  expiredLabel="now"
                  onExpire={() => setTick((value) => value + 1)}
                />
              </>
            ) : (
              "Resend OTP"
            )}
          </Button>
          <span className={styles.srOnly}>{tick}</span>
        </section>
      ) : null}
    </div>
  );
}
