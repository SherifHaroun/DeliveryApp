import { statusLabel } from "../../lib/format";
import styles from "./StatusBadge.module.css";

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "DELIVERED" ? "delivered" : status === "PENDING" ? "pending" : status === "OTP_SENT" ? "otp" : "custody";

  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      {statusLabel(status)}
      {status === "DELIVERED" ? " ✓" : ""}
    </span>
  );
}
