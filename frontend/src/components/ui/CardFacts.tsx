import type { DeliveryCard } from "../../api/types";
import { StatusBadge } from "./StatusBadge";
import styles from "./CardFacts.module.css";

export function CardFacts({ card }: { card: DeliveryCard }) {
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Card number</dt>
        <dd>{`•••• •••• •••• ${card.last4}`}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={card.status} />
        </dd>
      </div>
    </dl>
  );
}
