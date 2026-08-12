import { statusLabel } from "../../lib/format";
import styles from "./StatusBadge.module.css";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DELIVERED"
      ? "delivered"
      : status === "OTP_SENT"
        ? "otp"
        : status === "IN_CUSTODY"
          ? "custody"
          : "pending";

  return <span className={`${styles.badge} ${styles[tone]}`}>{statusLabel(status)}</span>;
}
