import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
