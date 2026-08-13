import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { ImageUp, QrCode } from "lucide-react";
import { api, ApiError } from "../api/client";
import type { DeliveryCard } from "../api/types";
import { Button } from "../components/ui/Button";
import { CardFacts } from "../components/ui/CardFacts";
import { PageHeader } from "../components/ui/PageHeader";
import { SuccessMark } from "../components/ui/SuccessMark";
import { playScanFeedback, useScanPrefs } from "../theme/ScanPrefsContext";
import styles from "./Scan.module.css";

type ScanResult = {
  card: DeliveryCard;
  alreadyInCustody: boolean;
};

type Phase = "scanning" | "success" | "existing";

export function ScanPage() {
  const navigate = useNavigate();
  const { prefs } = useScanPrefs();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const lastValueRef = useRef<string | null>(null);
  const ignoreUntilRef = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  async function takeScannedCard(raw: string) {
    const qrToken = raw.trim();
    if (!qrToken) return;
    if (handlingRef.current) return;
    if (lastValueRef.current === qrToken && Date.now() < ignoreUntilRef.current) return;

    handlingRef.current = true;
    lastValueRef.current = qrToken;
    setError(null);
    setBusy(true);

    try {
      const taken = await api<ScanResult>("/api/scan/custody", {
        method: "POST",
        body: JSON.stringify({ qrToken }),
      });
      await scannerRef.current?.stop().catch(() => undefined);
      playScanFeedback(prefs);
      setResult(taken);
      setPhase(taken.alreadyInCustody ? "existing" : "success");
    } catch (err) {
      handlingRef.current = false;
      ignoreUntilRef.current = Date.now() + 2500;
      setError(
        err instanceof ApiError ? err.message : "This QR code is invalid or the card was not found.",
      );
    } finally {
      setBusy(false);
    }
  }

  function scanAgain() {
    handlingRef.current = false;
    lastValueRef.current = null;
    ignoreUntilRef.current = 0;
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
    const scanner = new Html5Qrcode("qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    const config = {
      fps: 12,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
        const size = Math.max(180, Math.min(edge, 280));
        return { width: size, height: size };
      },
      aspectRatio: 1,
      disableFlip: false,
    };

    const onDecoded = (decoded: string) => {
      void takeScannedCard(decoded);
    };

    scanner
      .start({ facingMode: "environment" }, config, onDecoded, () => undefined)
      .catch(async () => {
        if (cancelled) return;
        try {
          await scanner.start({ facingMode: "user" }, config, onDecoded, () => undefined);
        } catch {
          if (!cancelled) {
            setCameraError("Camera unavailable. Use a photo of the QR code instead.");
          }
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
    lastValueRef.current = null;
    handlingRef.current = false;
    try {
      await scannerRef.current?.stop().catch(() => undefined);
      const fileScanner = new Html5Qrcode("qr-file-reader");
      const decoded = await fileScanner.scanFile(file, true);
      fileScanner.clear();
      await takeScannedCard(decoded);
    } catch {
      handlingRef.current = false;
      lastValueRef.current = null;
      setError("Could not read a QR code from that image.");
      setPhase("scanning");
      setScanKey((key) => key + 1);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const card = result?.card;

  return (
    <div>
      <PageHeader title="Scan QR" backTo="/" />

      <div className={phase === "scanning" ? styles.readerWrap : styles.hiddenReader}>
        <div id="qr-reader" className={styles.reader} />
        {phase === "scanning" ? (
          <div className={styles.frame} aria-hidden="true">
            <QrCode size={28} />
          </div>
        ) : null}
      </div>
      {phase === "scanning" ? (
        <>
          <p className={styles.instruction}>Place the QR code inside the frame</p>
          {cameraError ? <p className={styles.hint}>{cameraError}</p> : null}
          {error ? <p className="banner-error">{error}</p> : null}
          {busy ? <p className={styles.hint}>Looking up this card…</p> : null}

          <input
            ref={fileRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => void onPickImage(event.target.files?.[0])}
          />
          <Button variant="ghost" block type="button" onClick={() => fileRef.current?.click()}>
            <ImageUp size={18} />
            Use photo of QR code
          </Button>
        </>
      ) : null}

      <div id="qr-file-reader" className={styles.hiddenReader} />

      {phase === "success" && card ? (
        <section className={styles.panel}>
          <SuccessMark />
          <h2>Card Found ✓</h2>
          <CardFacts card={card} />
          <Button block onClick={() => navigate(`/deliveries/${card.id}`)}>
            Send OTP
          </Button>
        </section>
      ) : null}

      {phase === "existing" && card ? (
        <section className={styles.panel}>
          <SuccessMark />
          <h2>Card Found ✓</h2>
          <CardFacts card={card} />
          <Button block onClick={() => navigate(`/deliveries/${card.id}`)}>
            {card.status === "OTP_SENT" ? "Enter OTP" : "Send OTP"}
          </Button>
          <Button variant="ghost" block type="button" onClick={scanAgain}>
            Scan another card
          </Button>
        </section>
      ) : null}
    </div>
  );
}
