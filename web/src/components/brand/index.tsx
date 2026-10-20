import styles from "./index.module.css";

type Props = {
  /** Hide the wordmark and keep only the logo mark. */
  markOnly?: boolean;
  /** Animate the wordmark out (dashboard sidebar rail) instead of unmounting it. */
  collapsed?: boolean;
  className?: string;
};

/**
 * Product logo + wordmark. Rebrand here once — every shell (auth pages,
 * marketing header, dashboard sidebar) consumes this component.
 */
export function Brand({ markOnly = false, collapsed = false, className }: Props) {
  return (
    <span className={[styles.brand, collapsed ? styles.collapsed : "", className ?? ""].filter(Boolean).join(" ")}>
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 32 32" width="100%" height="100%">
          <rect width="32" height="32" rx="9" fill="var(--color-primary)" />
          <path d="M18.2 4.5 8.5 18.1h6.6l-1.3 9.4 9.7-13.6h-6.6l1.3-9.4Z" fill="#fff" />
        </svg>
      </span>
      {!markOnly && <span className={styles.name}>SaaS Boilerplate</span>}
    </span>
  );
}
