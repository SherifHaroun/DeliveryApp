import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { DeliveryCard as DeliveryCardType } from "../api/types";
import { Button } from "../components/ui/Button";
import { CardFacts } from "../components/ui/CardFacts";
import { Countdown } from "../components/ui/Countdown";
import { OtpInput } from "../components/ui/OtpInput";
import { PageHeader } from "../components/ui/PageHeader";
import { SuccessMark } from "../components/ui/SuccessMark";
import { maskedCard } from "../lib/format";
import styles from "./DeliveryDetail.module.css";

export function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState<DeliveryCardType | null>(null);
  const [code, setCode] = useState("");
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
    try {
      const result = await api<{ card: DeliveryCardType }>(`/api/deliveries/${id}/send-otp`, {
        method: "POST",
      });
      setCard(result.card);
      setCode("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong while sending the OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent) {
    event.preventDefault();
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api<DeliveryCardType>(`/api/deliveries/${id}/verify-otp`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setCard(updated);
      setCode("");
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
        setError("Could not verify OTP. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!card && !error) {
    return <p className={styles.muted}>Loading delivery…</p>;
  }

  if (!card) {
    return <p className="banner-error">{error}</p>;
  }

  const otp = card.otp;
  const canResend =
    !otp || otp.expired || otp.locked || new Date(otp.resendAvailableAt).getTime() <= Date.now();

  if (card.status === "DELIVERED") {
    return (
      <div className={styles.successPage}>
        <SuccessMark />
        <h1>Delivery Confirmed</h1>
        <p className={styles.cardLine}>{maskedCard(card.last4)}</p>
        <p className={styles.muted}>The delivery has been successfully confirmed.</p>
        <Button block onClick={() => navigate("/")}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={card.status === "OTP_SENT" ? "OTP Verification" : "Card"} backTo="/deliveries" />

      {card.status === "IN_CUSTODY" ? (
        <section className={styles.panel}>
          <CardFacts card={card} />
          {error ? <p className="banner-error">{error}</p> : null}
          <Button block loading={busy} onClick={() => void sendOtp()}>
            {busy ? "Sending..." : "Send OTP"}
          </Button>
        </section>
      ) : null}

      {card.status === "OTP_SENT" ? (
        <section className={styles.panel}>
          <p className={styles.lead}>Enter the 6-digit code sent to the customer.</p>
          {otp?.expired || !otp ? (
            <p className={styles.countdown}>OTP expired. Send a new OTP.</p>
          ) : (
            <p className={styles.countdown}>
              Expires in{" "}
              <Countdown until={otp.expiresAt} expiredLabel="0:00" onExpire={() => setTick((value) => value + 1)} />
            </p>
          )}
          {error ? <p className="banner-error">{error}</p> : null}
          <form className={styles.otpForm} onSubmit={verifyOtp}>
            <OtpInput value={code} onChange={setCode} />
            <Button
              type="submit"
              variant="success"
              block
              loading={busy}
              disabled={code.length !== 6 || Boolean(otp?.expired) || Boolean(otp?.locked)}
            >
              {busy ? "Verifying..." : "Verify"}
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
