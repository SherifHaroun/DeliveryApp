import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type ScanPrefs = {
  sound: boolean;
  vibration: boolean;
};

const KEY = "delivery_scan_prefs";
const defaults: ScanPrefs = { sound: true, vibration: true };

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
    if (!prefs.sound) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Feedback is optional; scanning should continue even if it fails.
  }
}
