import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { api } from "../api/client";
import type { DeliveryCard as DeliveryCardType } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatTime, groupByDay, maskedCard } from "../lib/format";
import styles from "./ListPage.module.css";

export function HistoryPage() {
  const [cards, setCards] = useState<DeliveryCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DeliveryCardType[]>("/api/deliveries?status=DELIVERED&sort=updated&dir=desc")
      .then(setCards)
      .catch((err: Error) => setError(err.message));
  }, []);

  const groups = useMemo(
    () =>
      groupByDay(cards ?? [], (card) => card.deliveredAt ?? card.updatedAt),
    [cards],
  );

  return (
    <div>
      <header className={styles.header}>
        <h1>History</h1>
      </header>

      {error ? <p className="banner-error">{error}</p> : null}

      {cards === null && !error ? (
        <div className={styles.list}>
          <Skeleton />
          <Skeleton />
        </div>
      ) : !cards?.length ? (
        <EmptyState
          icon={<History size={22} />}
          title="No deliveries yet"
          text="Completed deliveries will appear here."
        />
      ) : (
        <div className={styles.history}>
          {groups.map((group) => (
            <section key={group.heading}>
              <h2 className={styles.day}>{group.heading}</h2>
              <div className={styles.list}>
                {group.items.map((card) => (
                  <Link key={card.id} to={`/deliveries/${card.id}`} className={styles.historyRow}>
                    <div className={styles.historyTop}>
                      <strong>{maskedCard(card.last4)}</strong>
                      <StatusBadge status={card.status} />
                    </div>
                    <p className={styles.historyTime}>{formatTime(card.deliveredAt ?? card.updatedAt)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
