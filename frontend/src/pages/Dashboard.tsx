import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Package } from "lucide-react";
import { api } from "../api/client";
import type { DashboardData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { HowItWorks } from "../components/ui/WorkflowSteps";
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

  const recent = uniqueLatestByCardId(data?.recentActivity ?? []);

  return (
    <div>
      <header className={styles.header}>
        <p className={styles.brand}>Card Delivery</p>
        <h1>
          {greeting()}, {firstName(user?.fullName ?? "Courier")}
        </h1>
        <p className={styles.support}>Ready for your next delivery?</p>
      </header>

      <section className={styles.stats} aria-label="Delivery statistics">
        {data ? (
          <>
            <StatCard
              label="Cards To Be Delivered"
              value={data.toBeDelivered}
              icon={<Package size={18} />}
              tone="blue"
            />
            <StatCard
              label="Delivered Cards"
              value={data.delivered}
              icon={<CheckCircle2 size={18} />}
              tone="green"
            />
          </>
        ) : (
          <>
            <Skeleton height={128} />
            <Skeleton height={128} />
          </>
        )}
      </section>

      {error ? <p className="banner-error">{error}</p> : null}

      <section className={styles.recent}>
        <h2>Recent Activity</h2>
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
              <li key={item.cardId}>
                <Link to={`/deliveries/${item.cardId}`} className={styles.row}>
                  <div>
                    <strong>{item.identifier ?? maskedCard(item.last4)}</strong>
                    <span>
                      {dayHeading(item.createdAt)}, {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.how} aria-label="How it works">
        <h2>How It Works</h2>
        <HowItWorks />
      </section>
    </div>
  );
}

function uniqueLatestByCardId(items: DashboardData["recentActivity"]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.cardId || item.identifier;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
