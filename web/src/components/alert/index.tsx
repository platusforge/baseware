import styles from "./index.module.css";

export type AlertVariant = "info" | "success" | "warning" | "danger";

const ICONS: Record<AlertVariant, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  danger: "✕",
};

type Props = {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
  children: React.ReactNode;
};

export function Alert({ variant = "info", title, onDismiss, children }: Props) {
  const role = variant === "danger" || variant === "warning" ? "alert" : "status";
  return (
    <div role={role} className={[styles.alert, styles[variant]].filter(Boolean).join(" ")}>
      <span className={styles.icon} aria-hidden="true">{ICONS[variant]}</span>
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        <div className={styles.content}>{children}</div>
      </div>
      {onDismiss && (
        <button type="button" className={styles.dismiss} aria-label="Dismiss" onClick={onDismiss}>✕</button>
      )}
    </div>
  );
}
