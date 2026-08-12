import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

export function StatCard({
  label,
  value,
  icon,
  tone = "blue",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "blue" | "green" | "navy";
}) {
  return (
    <article className={`${styles.card} ${styles[tone]}`}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.value}>{value}</p>
      <p className={styles.label}>{label}</p>
    </article>
  );
}
