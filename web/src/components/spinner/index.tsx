import styles from "./index.module.css";

export function Spinner({ label = "Loading", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={styles.wrap} role="status">
      <span className={[styles.spinner, styles[size]].filter(Boolean).join(" ")} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
