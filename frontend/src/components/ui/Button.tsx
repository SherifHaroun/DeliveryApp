import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "success" | "ghost" | "danger";
  block?: boolean;
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  block,
  loading,
  className,
  children,
  disabled,
  ...props
}: Props) {
  const classes = [
    styles.button,
    styles[variant],
    block ? styles.block : "",
    className ?? "",
  ].join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
