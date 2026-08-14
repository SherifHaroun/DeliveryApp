import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { api } from "../api/client";
import type { DeliveryCard as DeliveryCardType, HistoryEvent } from "../api/types";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatTime, formatWhen, groupByDay } from "../lib/format";
import styles from "./ListPage.module.css";

type Tab = "activity" | "delivered";

export function HistoryPage() {
  const [tab, setTab] = useState<Tab>("activity");
  const [events, setEvents] = useState<HistoryEvent[] | null>(null);
  const [cards, setCards] = useState<DeliveryCardType[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const load = useCallback(() => {
    setError(null);
    if (tab === "activity") {
      setEvents(null);
      api<HistoryEvent[]>("/api/history")
        .then(setEvents)
        .catch((err: Error) => setError(err.message));
      return;
    }
    setCards(null);
    api<DeliveryCardType[]>("/api/deliveries?status=DELIVERED&sort=updated&dir=desc")
      .then(setCards)
      .catch((err: Error) => setError(err.message));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load, reload]);

  const eventGroups = useMemo(
    () => groupByDay(events ?? [], (event) => event.createdAt),
    [events],
  );
  const cardGroups = useMemo(
    () => groupByDay(cards ?? [], (card) => card.deliveredAt ?? card.updatedAt),
    [cards],
  );

  const loading = tab === "activity" ? events === null && !error : cards === null && !error;
  const empty = tab === "activity" ? events?.length === 0 : cards?.length === 0;

  return (
    <div>
      <header className={styles.header}>
        <h1>History</h1>
      </header>

      <div className={styles.filters}>
        <button
          type="button"
          className={tab === "activity" ? styles.chipActive : styles.chip}
          onClick={() => setTab("activity")}
        >
          Activity
        </button>
        <button
          type="button"
          className={tab === "delivered" ? styles.chipActive : styles.chip}
          onClick={() => setTab("delivered")}
        >
          Delivered
        </button>
      </div>

      {error ? (
        <div className={styles.errorPanel}>
          <p className="banner-error">
            <strong>Unable to Load History</strong>
            <br />
            Please try again.
          </p>
          <Button variant="ghost" onClick={() => setReload((value) => value + 1)}>
            Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className={styles.list}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : null}

      {empty ? (
        <EmptyState
          icon={<History size={22} />}
          title={tab === "activity" ? "No Activity Yet" : "No deliveries yet"}
          text={
            tab === "activity"
              ? "No card activity is available."
              : "Completed deliveries will appear here."
          }
        />
      ) : null}

      {tab === "activity" && events?.length ? (
        <div className={styles.history}>
          {eventGroups.map((group) => (
            <section key={group.heading}>
              <h2 className={styles.day}>{group.heading}</h2>
              <div className={styles.list}>
                {group.items.map((event) => (
                  <Link
                    key={event.id}
                    to={`/deliveries/${event.cardId}`}
                    className={styles.historyRow}
                  >
                    <div className={styles.historyTop}>
                      <strong>{event.cardIdentifier}</strong>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className={styles.historyAction}>{event.actionLabel}</p>
                    {event.customerName || event.courierName ? (
                      <p className={styles.historyMeta}>
                        {[event.customerName, event.courierName].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {event.message ? <p className={styles.historyMeta}>{event.message}</p> : null}
                    <p className={styles.historyTime}>{formatWhen(event.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {tab === "delivered" && cards?.length ? (
        <div className={styles.history}>
          {cardGroups.map((group) => (
            <section key={group.heading}>
              <h2 className={styles.day}>{group.heading}</h2>
              <div className={styles.list}>
                {group.items.map((card) => (
                  <Link key={card.id} to={`/deliveries/${card.id}`} className={styles.historyRow}>
                    <div className={styles.historyTop}>
                      <strong>{card.identifier}</strong>
                      <StatusBadge status={card.status} />
                    </div>
                    <p className={styles.historyTime}>{formatTime(card.deliveredAt ?? card.updatedAt)}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
