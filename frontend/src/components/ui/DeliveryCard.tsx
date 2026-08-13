import { Link } from "react-router-dom";
import type { DeliveryCard as DeliveryCardType } from "../../api/types";
import { formatDate, formatTime, maskedCard } from "../../lib/format";
import { StatusBadge } from "./StatusBadge";
import styles from "./DeliveryCard.module.css";

export function DeliveryCard({ card }: { card: DeliveryCardType }) {
  const when = card.deliveredAt ?? card.otpSentAt ?? card.scannedAt ?? card.updatedAt;

  return (
    <Link to={`/deliveries/${card.id}`} className={styles.card}>
      <div className={styles.top}>
        <strong>{maskedCard(card.last4)}</strong>
        <StatusBadge status={card.status} />
      </div>
      <dl className={styles.meta}>
        <div>
          <dt>Date</dt>
          <dd>{formatDate(when)}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTime(when)}</dd>
        </div>
      </dl>
    </Link>
  );
}
