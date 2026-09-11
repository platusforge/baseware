import styles from "./index.module.css";

type Props = {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  lines?: number;
};

export function Skeleton({ width, height, circle = false, lines = 1 }: Props) {
  if (lines > 1) {
    return (
      <div aria-hidden="true" style={{ display: "grid", gap: 8, width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <span key={i} className={styles.bar} style={{ height: height ?? 14, width: i === lines - 1 ? "70%" : "100%" }} />
        ))}
      </div>
    );
  }
  return <span aria-hidden="true" className={[styles.bar, circle ? styles.circle : ""].filter(Boolean).join(" ")} style={{ width, height }} />;
}
