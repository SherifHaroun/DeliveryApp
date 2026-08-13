import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./SettingsRow.module.css";

export function SettingsRow({
  to,
  icon,
  label,
  onClick,
  danger,
}: {
  to?: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const className = `${styles.row} ${danger ? styles.danger : ""}`;
  const body = (
    <>
      <span className={styles.icon}>{icon}</span>
      <span>{label}</span>
      <ChevronRight size={18} className={styles.chevron} />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {body}
    </button>
  );
}
