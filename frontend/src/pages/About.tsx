import { CreditCard } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import styles from "./Profile.module.css";

export function AboutPage() {
  return (
    <div>
      <PageHeader title="About" backTo="/profile" />
      <div className={styles.about}>
        <span className={styles.avatar} style={{ background: "var(--primary)" }}>
          <CreditCard size={28} />
        </span>
        <h2>Card Delivery</h2>
        <p>A secure mobile application for managing and confirming bank card deliveries.</p>
        <p className={styles.tagline}>Scan. Verify. Deliver.</p>
        <p className={styles.meta}>Version 1.0.0</p>
        <p className={styles.meta}>© 2026 Card Delivery</p>
      </div>
    </div>
  );
}
