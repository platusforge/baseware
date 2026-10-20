import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/**
 * Centered card shell for the auth pages (login, register, reset, verify,
 * invite): language switcher, brand on top, title + subtitle, form body,
 * optional footer links.
 */
export function AuthCard({ title, subtitle, children, footer }: Props) {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <div className={styles.lang}>
        <LanguageSwitcher variant="toggle" />
      </div>
      <section className={styles.card}>
        <Link to="/" className={styles.brand} aria-label={t("home")}>
          <Brand />
        </Link>
        <header className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.footer}>{footer}</footer>}
      </section>
    </main>
  );
}
