import type { DeliveryCard } from "../../api/types";
import { StatusBadge } from "./StatusBadge";
import styles from "./CardFacts.module.css";

export function CardFacts({ card }: { card: DeliveryCard }) {
  const identifier = card?.identifier?.trim() || card?.qrToken?.trim() || "—";
  const status = card?.status || "IN_CUSTODY";

  return (
    <dl className={styles.facts}>
      <div>
        <dt>Card ID</dt>
        <dd>{identifier}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={status} />
        </dd>
      </div>
    </dl>
  );
}
