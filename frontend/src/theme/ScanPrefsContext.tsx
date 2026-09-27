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
    window.addEventListener("click", unlock);
    window.addEventListener("touchend", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("touchend", unlock);
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
  void playScanSound().catch(() => undefined);
}

export async function playScanSound() {
  const buffer = prepareScanSound();
  const context = audioContext!;
  // Resume synchronously within the tap handler, before waiting for decoding.
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const [decoded] = await Promise.race([
      Promise.all([buffer, context.resume()]),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Sound playback unavailable")), 5000);
      }),
    ]);
    const source = context.createBufferSource();
    source.buffer = decoded;
    source.connect(context.destination);
    source.onended = () => source.disconnect();
    source.start();
  } finally {
    clearTimeout(timeout);
  }
}
