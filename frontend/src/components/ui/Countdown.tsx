import { useEffect, useState } from "react";

function remainingMs(iso: string) {
  return Math.max(0, new Date(iso).getTime() - Date.now());
}

function formatMs(ms: number) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function Countdown({
  until,
  expiredLabel,
  onExpire,
}: {
  until: string;
  expiredLabel: string;
  onExpire?: () => void;
}) {
  const [ms, setMs] = useState(() => remainingMs(until));

  useEffect(() => {
    setMs(remainingMs(until));
    const timer = window.setInterval(() => {
      const next = remainingMs(until);
      setMs(next);
      if (next <= 0) {
        window.clearInterval(timer);
        onExpire?.();
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [until, onExpire]);

  if (ms <= 0) {
    return <span>{expiredLabel}</span>;
  }

  return <span>{formatMs(ms)}</span>;
}
