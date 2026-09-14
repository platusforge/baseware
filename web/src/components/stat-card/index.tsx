import styles from "./index.module.css";

type Props = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  loading?: boolean;
  delta?: { value: string; trend: "up" | "down" | "flat"; invert?: boolean };
  icon?: React.ReactNode;
};

export function StatCard({ label, value, hint, loading = false, delta, icon }: Props) {
  const good = delta && (delta.trend === "up" !== Boolean(delta.invert) ? "good" : delta.trend === "flat" ? "flat" : "bad");
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
      </div>
      <p className={styles.value} aria-busy={loading || undefined}>
        {loading ? "—" : value}
      </p>
      {(delta || hint) && (
        <p className={styles.meta}>
          {delta && (
            <span className={[styles.delta, good ? styles[good] : ""].filter(Boolean).join(" ")}>
              {delta.trend === "up" ? "▲" : delta.trend === "down" ? "▼" : "●"} {delta.value}
            </span>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </p>
      )}
    </div>
  );
}
