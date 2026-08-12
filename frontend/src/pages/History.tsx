import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { api } from "../api/client";
import type { HistoryEvent } from "../api/types";
import { EmptyState } from "../components/ui/EmptyState";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatDate, formatTime } from "../lib/format";
import styles from "./ListPage.module.css";

export function HistoryPage() {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<HistoryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    api<HistoryEvent[]>(`/api/history?${params.toString()}`)
      .then(setRows)
      .catch((err: Error) => setError(err.message));
  }, [query]);

  return (
    <div>
      <header className={styles.header}>
        <h1>History</h1>
        <p>Read-only audit log of your delivery activity.</p>
      </header>

      <input
        className={styles.search}
        placeholder="Search by card, customer, or action"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      {!rows.length ? (
        <EmptyState
          icon={<History size={22} />}
          title="No history yet"
          text="Scan, custody, OTP, and delivery events will appear here."
        />
      ) : (
        <div className={styles.history}>
          {rows.map((row) => (
            <article key={row.id} className={styles.historyRow}>
              <div className={styles.historyTop}>
                <strong>{row.cardIdentifier}</strong>
                <StatusBadge status={row.status} />
              </div>
              <p className={styles.historyAction}>{row.actionLabel}</p>
              <dl className={styles.historyMeta}>
                <div>
                  <dt>Customer</dt>
                  <dd>{row.customerName}</dd>
                </div>
                <div>
                  <dt>Courier</dt>
                  <dd>{row.courierName}</dd>
                </div>
                <div>
                  <dt>Date</dt>
                  <dd>{formatDate(row.createdAt)}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{formatTime(row.createdAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
