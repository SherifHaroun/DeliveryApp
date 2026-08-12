import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "success" | "warning" | "ghost" | "danger";
  block?: boolean;
  children: ReactNode;
};

export function Button({ variant = "primary", block, className, children, ...props }: Props) {
  const classes = [
    styles.button,
    styles[variant],
    block ? styles.block : "",
    className ?? "",
  ].join(" ");

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
