import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Package, QrCode, WalletCards } from "lucide-react";
import { api } from "../api/client";
import type { DashboardData } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ActivityItem } from "../components/ui/ActivityItem";
import { EmptyState } from "../components/ui/EmptyState";
import { StatCard } from "../components/ui/StatCard";
import { WorkflowSteps } from "../components/ui/WorkflowSteps";
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

  return (
    <div>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Welcome back</p>
          <h1>{user?.fullName}</h1>
        </div>
      </header>

      <WorkflowSteps current={0} />

      <Link to="/scan" className={styles.scan}>
        <QrCode size={28} />
        <div>
          <strong>Scan QR Code</strong>
          <span>Take a card into your custody</span>
        </div>
      </Link>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.stats}>
        <StatCard
          label="Cards To Be Delivered"
          value={data?.toBeDelivered ?? 0}
          icon={<Package size={18} />}
          tone="blue"
        />
        <StatCard
          label="Delivered Cards"
          value={data?.delivered ?? 0}
          icon={<CheckCircle2 size={18} />}
          tone="green"
        />
        <StatCard
          label="My Cards In Custody"
          value={data?.inCustody ?? 0}
          icon={<WalletCards size={18} />}
          tone="navy"
        />
      </section>

      <section className={styles.activity}>
        <div className={styles.activityHead}>
          <h2>Recent Activity</h2>
        </div>
        {!data?.recentActivity.length ? (
          <EmptyState
            icon={<QrCode size={22} />}
            title="No activity yet"
            text="Scan a card to start a delivery."
          />
        ) : (
          <ul>
            {data.recentActivity.map((item) => (
              <ActivityItem
                key={item.id}
                action={item.action}
                title={item.summary}
                detail={`${item.identifier ?? ""} · ${item.customerName}`.trim()}
                createdAt={item.createdAt}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
