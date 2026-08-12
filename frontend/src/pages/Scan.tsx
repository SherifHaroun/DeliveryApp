import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, ImageUp } from "lucide-react";
import { api, ApiError } from "../api/client";
import type { DeliveryCard } from "../api/types";
import { Button } from "../components/ui/Button";
import { CardFacts } from "../components/ui/CardFacts";
import { WorkflowSteps } from "../components/ui/WorkflowSteps";
import styles from "./Scan.module.css";

type ScanResult = {
  card: DeliveryCard;
  alreadyInCustody: boolean;
};

type Phase = "scanning" | "preview" | "success" | "existing";

export function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [preview, setPreview] = useState<DeliveryCard | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanKey, setScanKey] = useState(0);
  const confirmingRef = useRef(false);

  async function lookupToken(qrToken: string) {
    if (handlingRef.current) return;
    handlingRef.current = true;
    setError(null);
    setBusy(true);
    try {
      const lookedUp = await api<ScanResult>("/api/scan/lookup", {
        method: "POST",
        body: JSON.stringify({ qrToken }),
      });
      await scannerRef.current?.stop().catch(() => undefined);
      setPreview(lookedUp.card);
      setPhase(lookedUp.alreadyInCustody ? "existing" : "preview");
    } catch (err) {
      handlingRef.current = false;
      setError(err instanceof ApiError ? err.message : "Could not read this QR code.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmCustody() {
    if (!preview || confirmingRef.current) return;
    confirmingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const taken = await api<ScanResult>("/api/scan/custody", {
        method: "POST",
        body: JSON.stringify({ qrToken: preview.qrToken }),
      });
      setResult(taken);
      setPhase(taken.alreadyInCustody ? "existing" : "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not take this card into custody.");
    } finally {
      confirmingRef.current = false;
      setBusy(false);
    }
  }

  function scanAgain() {
    handlingRef.current = false;
    setPreview(null);
    setResult(null);
    setError(null);
    setPhase("scanning");
    setScanKey((key) => key + 1);
  }

  useEffect(() => {
    if (phase !== "scanning") {
      return;
    }

    let cancelled = false;
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          void lookupToken(decoded.trim());
        },
        () => undefined,
      )
      .catch(() => {
        if (!cancelled) {
          setCameraError("Camera unavailable. Use a photo of the QR code instead.");
        }
      });

    return () => {
      cancelled = true;
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => undefined);
    };
  }, [phase, scanKey]);

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      await scannerRef.current?.stop().catch(() => undefined);
      const fileScanner = new Html5Qrcode("qr-file-reader");
      const decoded = await fileScanner.scanFile(file, true);
      fileScanner.clear();
      handlingRef.current = false;
      await lookupToken(decoded.trim());
    } catch {
      handlingRef.current = false;
      setError("Could not read a QR code from that image.");
      setPhase("scanning");
      setScanKey((key) => key + 1);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const shownCard = result?.card ?? preview;
  const nextDeliveryId = shownCard?.id;

  return (
    <div>
      <header className={styles.header}>
        <h1>Scan QR Code</h1>
        <p>Point the camera at the QR on the card envelope. Do not type the code.</p>
      </header>

      <WorkflowSteps current={phase === "success" || phase === "existing" ? 2 : phase === "preview" ? 1 : 0} />

      {phase === "scanning" ? (
        <>
          <div className={styles.readerWrap}>
            <div id="qr-reader" className={styles.reader} />
          </div>
          {cameraError ? <p className={styles.hint}>{cameraError}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {busy ? <p className={styles.hint}>Looking up this card…</p> : null}

          <input
            ref={fileRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={(event) => void onPickImage(event.target.files?.[0])}
          />
          <Button variant="ghost" block type="button" onClick={() => fileRef.current?.click()}>
            <ImageUp size={18} />
            Use photo of QR code
          </Button>
        </>
      ) : null}

      <div id="qr-file-reader" className={styles.hiddenReader} />

      {phase === "preview" && preview ? (
        <section className={styles.panel}>
          <h2>Card found</h2>
          <p className={styles.lead}>Confirm that you are taking this card into your custody.</p>
          <CardFacts card={preview} timestamp={preview.createdAt} />
          {error ? <p className={styles.error}>{error}</p> : null}
          <Button block disabled={busy} onClick={() => void confirmCustody()}>
            {busy ? "Saving…" : "Take into custody"}
          </Button>
          <Button variant="ghost" block type="button" onClick={scanAgain}>
            Scan a different card
          </Button>
        </section>
      ) : null}

      {phase === "success" && result ? (
        <section className={styles.panel}>
          <div className={styles.successIcon}>
            <CheckCircle2 size={36} />
          </div>
          <h2>Card Successfully Added to Your Custody</h2>
          <CardFacts card={result.card} timestamp={result.card.scannedAt} />
          <Button
            variant="warning"
            block
            onClick={() => navigate(`/deliveries/${result.card.id}`)}
          >
            Send OTP to Customer
          </Button>
        </section>
      ) : null}

      {phase === "existing" && shownCard ? (
        <section className={styles.panel}>
          <h2>This card is already in your custody</h2>
          <p className={styles.lead}>No duplicate delivery was created.</p>
          <CardFacts card={shownCard} timestamp={shownCard.scannedAt} />
          {nextDeliveryId ? (
            <Button
              variant="warning"
              block
              onClick={() => navigate(`/deliveries/${nextDeliveryId}`)}
            >
              {shownCard.status === "OTP_SENT" ? "Enter OTP" : "Send OTP to Customer"}
            </Button>
          ) : null}
          <Button variant="ghost" block type="button" onClick={scanAgain}>
            Scan another card
          </Button>
        </section>
      ) : null}
    </div>
  );
}
