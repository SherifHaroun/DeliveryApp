import { useRef } from "react";
import styles from "./OtpInput.module.css";

export function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  function setAt(index: number, digit: string) {
    const next = digits.map((item, i) => (i === index ? digit : item)).join("").replace(/\D/g, "").slice(0, 6);
    onChange(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  return (
    <div className={styles.row}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          className={styles.box}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(event) => {
            const char = event.target.value.replace(/\D/g, "").slice(-1);
            setAt(index, char);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            onChange(event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
          }}
          aria-label={`Digit ${index + 1}`}
          size={1}
        />
      ))}
    </div>
  );
}
