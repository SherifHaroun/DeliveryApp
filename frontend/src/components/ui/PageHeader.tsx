import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import styles from "./PageHeader.module.css";

export function PageHeader({
  title,
  backTo,
}: {
  title: string;
  backTo?: string;
}) {
  return (
    <header className={styles.header}>
      {backTo ? (
        <Link to={backTo} className={styles.back} aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
      ) : null}
      <h1>{title}</h1>
    </header>
  );
}
