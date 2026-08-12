import type { DeliveryCard } from "../../api/types";
import { formatWhen, maskEmail } from "../../lib/format";
import { StatusBadge } from "./StatusBadge";
import styles from "./CardFacts.module.css";

export function CardFacts({
  card,
  timestamp,
}: {
  card: DeliveryCard;
  timestamp?: string | null;
}) {
  const when = timestamp ?? card.scannedAt ?? card.updatedAt;

  return (
    <dl className={styles.facts}>
      <div>
        <dt>Card identifier</dt>
        <dd>{card.identifier}</dd>
      </div>
      <div>
        <dt>Customer name</dt>
        <dd>{card.customer.fullName}</dd>
      </div>
      <div>
        <dt>Customer email</dt>
        <dd>{maskEmail(card.customer.email)}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={card.status} />
        </dd>
      </div>
      <div>
        <dt>Courier</dt>
        <dd>{card.courier?.fullName ?? "Unassigned"}</dd>
      </div>
      <div>
        <dt>Date/time</dt>
        <dd>{formatWhen(when)}</dd>
      </div>
    </dl>
  );
}
