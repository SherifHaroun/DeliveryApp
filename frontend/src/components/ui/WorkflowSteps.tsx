import { Check } from "lucide-react";
import type { CardStatus } from "../../api/types";
import styles from "./WorkflowSteps.module.css";

const STEPS = ["Scan", "Custody", "Send OTP", "Verify", "Delivered"] as const;

export function workflowIndex(status?: CardStatus | "SCAN") {
  switch (status) {
    case "SCAN":
      return 0;
    case "IN_CUSTODY":
      return 2;
    case "OTP_SENT":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return 0;
  }
}

export function WorkflowSteps({
  current,
}: {
  current: number;
}) {
  return (
    <ol className={styles.steps} aria-label="Delivery workflow">
      {STEPS.map((label, index) => {
        const state = index < current ? "done" : index === current ? "active" : "todo";
        return (
          <li key={label} className={`${styles.step} ${styles[state]}`}>
            <span className={styles.dot} aria-hidden="true">
              {index < current ? <Check size={12} strokeWidth={3} /> : index + 1}
            </span>
            <span className={styles.label}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
