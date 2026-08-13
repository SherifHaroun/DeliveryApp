import type { DeliveryCard } from "../../api/types";
import { StatusBadge } from "./StatusBadge";
import styles from "./CardFacts.module.css";

export function CardFacts({ card }: { card: DeliveryCard }) {
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Card</dt>
        <dd>{card.identifier}</dd>
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
