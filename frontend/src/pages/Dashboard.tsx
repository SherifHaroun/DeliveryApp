import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { api } from "../api/client";
import type { DashboardData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { dayHeading, firstName, formatTime, greeting, maskedCard } from "../lib/format";
import styles from "./Dashboard.module.css";

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  const recent = data?.recentActivity ?? [];

  return (
    <div>
      <header className={styles.header}>
        <p className={styles.brand}>Card Delivery</p>
        <h1>
          {greeting()}, {firstName(user?.fullName ?? "Courier")}
        </h1>
        <p className={styles.support}>Ready for your next delivery?</p>
      </header>

      <section className={styles.hero}>
        <div>
          <h2>Ready to Deliver</h2>
          <p>Scan a card to begin the delivery process.</p>
        </div>
        <span className={styles.heroIcon}>
          <Package size={28} />
        </span>
      </section>

      {error ? <p className="banner-error">{error}</p> : null}

      <section className={styles.recent}>
        <h2>Recent Deliveries</h2>
        {!data ? (
          <div className={styles.stack}>
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        ) : !recent.length ? (
          <EmptyState
            icon={<Package size={22} />}
            title="No deliveries yet"
            text="Scan a card to start your first delivery."
          />
        ) : (
          <ul className={styles.list}>
            {recent.slice(0, 6).map((item) => (
              <li key={item.id} className={styles.row}>
                <div>
                  <strong>{maskedCard(item.last4)}</strong>
                  <span>
                    {dayHeading(item.createdAt)}, {formatTime(item.createdAt)}
                  </span>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
