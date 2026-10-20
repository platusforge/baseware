import { forwardRef } from "react";
import styles from "./index.module.css";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "danger-outline";
export type ButtonSize = "sm" | "md" | "lg";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading = false, fullWidth = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[styles.btn, styles[variant], styles[size], fullWidth ? styles.full : "", className ?? ""].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className={styles.loader} aria-hidden="true" />}
      {children}
    </button>
  );
})
