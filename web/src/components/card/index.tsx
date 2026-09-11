import styles from "./index.module.css";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={[styles.card, className ?? ""].filter(Boolean).join(" ")}>{children}</section>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <header className={styles.header}>{children}</header>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className={styles.title}>{children}</h3>;
}

export function CardDescription({ children }: { children: React.ReactNode }) {
  return <p className={styles.description}>{children}</p>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className={styles.content}>{children}</div>;
}

export function CardFooter({ children }: { children: React.ReactNode }) {
  return <footer className={styles.footer}>{children}</footer>;
}
