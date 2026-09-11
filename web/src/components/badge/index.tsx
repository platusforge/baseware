import styles from "./index.module.css";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "info";

type Props = {
  variant?: BadgeVariant;
  dot?: boolean;
  children: React.ReactNode;
};

export function Badge({ variant = "default", dot = false, children }: Props) {
  return (
    <span className={[styles.badge, styles[variant]].filter(Boolean).join(" ")}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  );
}
