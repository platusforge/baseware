import { Link } from "react-router-dom";
import { Brand } from "@/components/brand";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

/** Shared footer for the public/marketing pages. */
export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <Brand />
          <p className={styles.copy}>
            © {year} · {t("rights")}
          </p>
        </div>
        <nav className={styles.links} aria-label={t("footerLinks")}>
          <Link to="/pricing">{t("pricing")}</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/login">{t("login")}</Link>
          <Link to="/terms">{t("terms")}</Link>
          <Link to="/privacy">{t("privacy")}</Link>
          <Link to="/dpa">{t("dpa")}</Link>
        </nav>
      </div>
    </footer>
  );
}
