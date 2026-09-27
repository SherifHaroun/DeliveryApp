import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
  to,
  compact = false,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "blue" | "green" | "navy" | "red";
  to?: string;
  compact?: boolean;
}) {
  const className = `${styles.card} ${styles[tone]}${to ? ` ${styles.clickable}` : ""}${compact ? ` ${styles.compact}` : ""}`;
  const content = (
    <>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
