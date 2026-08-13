import type { ReactNode } from "react";
import styles from "./SettingsGroup.module.css";

export function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      <div className={styles.card}>{children}</div>
    </section>
  );
}
