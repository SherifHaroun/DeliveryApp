import { CheckCircle2, QrCode, Send, ShieldAlert } from "lucide-react";
import { formatWhen } from "../../lib/format";
import styles from "./ActivityItem.module.css";

export function ActivityItem({
  action,
  title,
  detail,
  createdAt,
}: {
  action: string;
  title: string;
  detail?: string;
  createdAt: string;
}) {
  const icon =
    action === "DELIVERED" || action === "OTP_VERIFIED" ? (
      <CheckCircle2 size={16} />
    ) : action === "OTP_FAILED" ? (
      <ShieldAlert size={16} />
    ) : action === "OTP_SENT" ? (
      <Send size={16} />
    ) : (
      <QrCode size={16} />
    );

  const tone =
    action === "DELIVERED" || action === "OTP_VERIFIED"
      ? "green"
      : action === "OTP_FAILED"
        ? "red"
        : action === "OTP_SENT"
          ? "orange"
          : "blue";

  return (
    <li className={styles.item}>
      <span className={`${styles.icon} ${styles[tone]}`}>{icon}</span>
      <div className={styles.body}>
        <p>{title}</p>
        {detail ? <span className={styles.detail}>{detail}</span> : null}
        <time>{formatWhen(createdAt)}</time>
      </div>
    </li>
  );
}
