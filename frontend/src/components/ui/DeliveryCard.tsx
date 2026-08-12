import { Link } from "react-router-dom";
import type { DeliveryCard as DeliveryCardType } from "../../api/types";
import { formatWhen, maskEmail } from "../../lib/format";
import { StatusBadge } from "./StatusBadge";
import styles from "./DeliveryCard.module.css";

function nextAction(status: string) {
  if (status === "IN_CUSTODY") return { label: "Send OTP to Customer", href: true };
  if (status === "OTP_SENT") return { label: "Enter OTP", href: true };
  if (status === "DELIVERED") return { label: "Delivered", href: false };
  return null;
}

export function DeliveryCard({ card }: { card: DeliveryCardType }) {
  const action = nextAction(card.status);
  const assigned = card.assignedAt ?? card.scannedAt;
  const detailTo = `/deliveries/${card.id}`;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div>
          <p className={styles.id}>{card.identifier}</p>
          <p className={styles.name}>{card.customer.fullName}</p>
        </div>
        <StatusBadge status={card.status} />
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Customer email</dt>
          <dd>{maskEmail(card.customer.email)}</dd>
        </div>
        <div>
          <dt>Assigned</dt>
          <dd>{formatWhen(assigned ?? null)}</dd>
        </div>
        <div>
          <dt>Last action</dt>
          <dd>{card.lastAction ? `${card.lastAction.label} · ${formatWhen(card.lastAction.at)}` : "—"}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        {action?.href ? (
          <Link to={detailTo} className={styles.cta}>
            {action.label}
          </Link>
        ) : (
          <span className={styles.done}>{action?.label ?? "Delivered"}</span>
        )}
      </div>
    </article>
  );
}
