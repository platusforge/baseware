import { Link, NavLink } from "react-router-dom";
import { Brand } from "@/components/brand";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

/**
 * Sticky top bar for the public/marketing pages. Shows session-aware CTAs
 * (Log in / Start free, or Dashboard when signed in) and the language toggle.
 */
export function SiteHeader() {
  const { user, loading } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navClass = ({ isActive }: { isActive: boolean }) => [styles.link, isActive ? styles.active : ""].filter(Boolean).join(" ");

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brandLink} aria-label="Home">
          <Brand />
        </Link>

        <nav className={styles.nav} aria-label={t("mainNav")}>
          <NavLink to="/pricing" className={navClass}>
            {t("pricing")}
          </NavLink>
          <NavLink to="/blog" className={navClass}>
            Blog
          </NavLink>
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.lang}
            onClick={() => setLang(lang === "en" ? "pt-BR" : "en")}
            aria-label={t("switchLanguage")}
          >
            {lang === "en" ? "PT" : "EN"}
          </button>

          {!loading &&
            (user ? (
              <Link to="/dashboard" className={styles.cta}>
                {t("dashboard")}
              </Link>
            ) : (
              <>
                <Link to="/login" className={styles.login}>
                  {t("login")}
                </Link>
                <Link to="/register" className={styles.cta}>
                  {t("cta")}
                </Link>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}
