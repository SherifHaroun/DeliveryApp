import type { DeliveryCard } from "../../api/types";
import { StatusBadge } from "./StatusBadge";
import styles from "./CardFacts.module.css";

export function CardFacts({ card }: { card: DeliveryCard }) {
  const identifier = card?.identifier?.trim() || "—";
  const status = card?.status || "IN_CUSTODY";
  const name = card.customer?.fullName?.trim() || "";
  const email = card.customer?.email?.trim() || "";
  const address = [card.customer?.address?.trim(), card.customer?.city?.trim()].filter(Boolean).join(", ");
  const hasCustomer = Boolean(name || email || address);

  return (
    <div className={styles.wrap}>
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

      {hasCustomer ? (
        <>
          <h3 className={styles.sectionTitle}>Customer Information</h3>
          <dl className={styles.facts}>
            {name ? (
              <div>
                <dt>Name</dt>
                <dd>{name}</dd>
              </div>
            ) : null}
            {email ? (
              <div>
                <dt>Email</dt>
                <dd>{email}</dd>
              </div>
            ) : null}
            {address ? (
              <div>
                <dt>Address</dt>
                <dd>{address}</dd>
              </div>
            ) : null}
          </dl>
        </>
      ) : null}
    </div>
  );
}
