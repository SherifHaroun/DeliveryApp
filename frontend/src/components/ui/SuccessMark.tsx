import { Check } from "lucide-react";
import styles from "./SuccessMark.module.css";

export function SuccessMark() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <Check size={36} strokeWidth={2.5} />
    </div>
  );
}
