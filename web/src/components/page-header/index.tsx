import styles from "./index.module.css";

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
