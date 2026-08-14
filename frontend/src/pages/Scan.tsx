import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { ImageUp } from "lucide-react";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { CardFacts } from "../components/ui/CardFacts";
import { PageHeader } from "../components/ui/PageHeader";
import { ScanErrorBoundary } from "../components/ui/ScanErrorBoundary";
import { SuccessMark } from "../components/ui/SuccessMark";
import { playScanFeedback, useScanPrefs } from "../theme/ScanPrefsContext";
import { mapScanError, parseScanResponse, toDisplayCard } from "./scanUtils";
import styles from "./Scan.module.css";

type Phase = "scanning" | "checking" | "found" | "error";

export function ScanPage() {
  const navigate = useNavigate();
  const { prefs } = useScanPrefs();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [scanKey, setScanKey] = useState(0);
  const [card, setCard] = useState<ReturnType<typeof toDisplayCard>>(null);
  const [errorTitle, setErrorTitle] = useState("Unable to read this card");
  const [errorText, setErrorText] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);

  async function stopScanner() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Already stopped, or html5-qrcode threw a string error.
    }
  }

  function resetScanner() {
    handlingRef.current = false;
    setCard(null);
    setErrorText("");
    setCameraError(null);
    setPhase("scanning");
    setScanKey((key) => key + 1);
  }

  async function takeScannedCard(raw: string) {
    const qrToken = String(raw ?? "").trim();
    if (!qrToken || handlingRef.current) return;

    handlingRef.current = true;
    try {
      await stopScanner();
      setPhase("checking");
      const payload = await api<unknown>("/api/scan/custody", {
        method: "POST",
        body: JSON.stringify({ qrToken }),
      });
      const parsed = parseScanResponse(payload);
      const display = toDisplayCard(parsed.card);
      if (!display) {
        setErrorTitle("Unable to read this card");
        setErrorText("The QR code was scanned, but the card could not be found.");
        setPhase("error");
        return;
      }
      playScanFeedback(prefs);
      setCard(display);
      setPhase("found");
    } catch (error) {
      console.error("Scan lookup failed", error);
      const mapped = mapScanError(error);
      setErrorTitle(mapped.title);
      setErrorText(mapped.text);
      setPhase("error");
    }
  }

  useEffect(() => {
    if (phase !== "scanning") return;

    let cancelled = false;
    const node = document.getElementById("qr-reader");
    if (!node) return;

    const scanner = new Html5Qrcode("qr-reader", {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    });
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(Number(viewfinderWidth) || 0, Number(viewfinderHeight) || 0);
        const size = Math.max(120, Math.min(Math.floor(minEdge * 0.5), 196));
        return { width: size, height: size };
      },
      disableFlip: false,
    };

    const onDecoded = (decoded: string) => {
      void takeScannedCard(decoded);
    };

    scanner
      .start({ facingMode: "environment" }, config, onDecoded, () => undefined)
      .then(() => {
        if (cancelled) {
          void scanner.stop().catch(() => undefined);
        }
      })
      .catch(async () => {
        if (cancelled) return;
        try {
          await scanner.start({ facingMode: "user" }, config, onDecoded, () => undefined);
          if (cancelled) {
            await scanner.stop().catch(() => undefined);
          }
        } catch {
          if (!cancelled) {
            setCameraError("Camera unavailable. Use a photo of the QR code instead.");
          }
        }
      });

    return () => {
      cancelled = true;
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
      try {
        if (scanner.isScanning) {
          void scanner.stop().catch(() => undefined);
        }
      } catch {
        // html5-qrcode throws a string if already stopped.
      }
    };
  }, [phase, scanKey]);

  async function onPickImage(file: File | undefined) {
    if (!file || handlingRef.current) return;
    await stopScanner();
    try {
      const fileScanner = new Html5Qrcode("qr-file-reader");
      const decoded = await fileScanner.scanFile(file, false);
      try {
        fileScanner.clear();
      } catch {
        // File scanner DOM is not React-managed.
      }
      await takeScannedCard(decoded);
    } catch {
      handlingRef.current = false;
      setErrorTitle("Invalid QR code");
      setErrorText("Unable to recognize this QR code.");
      setPhase("error");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Scan Card QR Code" backTo="/" />
      <ScanErrorBoundary onReset={resetScanner}>
        {phase === "scanning" ? (
          <>
            <div className={styles.readerWrap}>
              <div id="qr-reader" className={styles.reader} />
              <div className={styles.frame} aria-hidden="true">
                <span className={styles.scanLine} />
              </div>
            </div>
            <p className={styles.instruction}>Place the QR code inside the frame</p>
            {cameraError ? <p className={styles.hint}>{cameraError}</p> : null}
            <input
              ref={fileRef}
              className={styles.fileInput}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => void onPickImage(event.target.files?.[0])}
            />
            {cameraError ? (
              <Button variant="ghost" block type="button" onClick={() => fileRef.current?.click()}>
                <ImageUp size={18} />
                Use photo of QR code
              </Button>
            ) : null}
          </>
        ) : null}

        {phase === "checking" ? (
          <section className={styles.panel}>
            <p className={styles.hint}>Checking card...</p>
          </section>
        ) : null}

        {phase === "found" && card ? (
          <section className={styles.panel}>
            <SuccessMark />
            <h2>Card Found ✓</h2>
            <CardFacts card={card} />
            <Button block onClick={() => navigate(`/deliveries/${card.id}`)}>
              {card.status === "OTP_SENT" ? "Enter OTP" : "Send OTP"}
            </Button>
          </section>
        ) : null}

        {phase === "error" ? (
          <section className={styles.panel}>
            <h2>{errorTitle}</h2>
            <p className={styles.lead}>{errorText}</p>
            <Button block onClick={resetScanner}>
              Try Again
            </Button>
          </section>
        ) : null}

        <div id="qr-file-reader" className={styles.hiddenReader} />
      </ScanErrorBoundary>
    </div>
  );
}
