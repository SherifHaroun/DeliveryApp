import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ScanPrefs = {
  sound: boolean;
  vibration: boolean;
};

const KEY = "delivery_scan_prefs";
const defaults: ScanPrefs = { sound: true, vibration: true };

let audioContext: AudioContext | undefined;
let scanSound: Promise<AudioBuffer> | undefined;

function prepareScanSound() {
  audioContext ??= new AudioContext();
  const context = audioContext;
  scanSound ??= fetch(`${import.meta.env.BASE_URL}audio/qr-scan.mp3`)
    .then(response => {
      if (!response.ok) throw new Error("Scan sound unavailable");
      return response.arrayBuffer();
    })
    .then(bytes => context.decodeAudioData(bytes))
    .catch(error => { scanSound = undefined; throw error; });
  return scanSound;
}

function readPrefs(): ScanPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<ScanPrefs>;
    return { sound: parsed.sound !== false, vibration: parsed.vibration !== false };
  } catch {
    return defaults;
  }
}

const ScanPrefsContext = createContext<{
  prefs: ScanPrefs;
  setPrefs: (next: ScanPrefs) => void;
} | null>(null);

export function ScanPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<ScanPrefs>(readPrefs);

  useEffect(() => {
    if (!prefs.sound) return;
    // Decode in advance and unlock playback on a tap for mobile browsers.
    const unlock = () => {
      try {
        void prepareScanSound().catch(() => undefined);
        void audioContext?.resume().catch(() => undefined);
      } catch { /* Audio support is optional. */ }
    };
    try { void prepareScanSound().catch(() => undefined); } catch { /* Audio support is optional. */ }
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [prefs.sound]);

  const value = useMemo(
    () => ({
      prefs,
      setPrefs(next: ScanPrefs) {
        setPrefsState(next);
        localStorage.setItem(KEY, JSON.stringify(next));
      },
    }),
    [prefs],
  );

  return <ScanPrefsContext.Provider value={value}>{children}</ScanPrefsContext.Provider>;
}

export function useScanPrefs() {
  const ctx = useContext(ScanPrefsContext);
  if (!ctx) throw new Error("useScanPrefs must be used within ScanPrefsProvider");
  return ctx;
}

export function playScanFeedback(prefs: ScanPrefs) {
  try {
    if (prefs.vibration && "vibrate" in navigator) {
      navigator.vibrate(40);
    }
  } catch {
    // Feedback is optional; scanning should continue even if it fails.
  }
  if (!prefs.sound) return;
  try {
    const buffer = prepareScanSound();
    const context = audioContext!;
    void Promise.all([buffer, context.resume()]).then(([decoded]) => {
      const source = context.createBufferSource();
      source.buffer = decoded;
      source.connect(context.destination);
      source.onended = () => source.disconnect();
      source.start();
    }).catch(() => undefined);
  } catch {
    // An unavailable sound must never interrupt a scan.
  }
}
