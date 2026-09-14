import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("analytics-consent")) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  function choose(value: "granted" | "denied") {
    try {
      localStorage.setItem("analytics-consent", value);
    } catch {
      // ignore
    }
    setVisible(false);
    if (value === "granted") window.location.reload();
  }

  return (
    <div role="dialog" aria-label="Cookie consent" aria-live="polite" className={`card ${styles.banner}`}>
      <strong>{t("consentTitle")}</strong>
      <p>{t("consentBody")}</p>
      <div className={styles.actions}>
        <button type="button" className="btn" onClick={() => choose("granted")}>
          {t("accept")}
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => choose("denied")}>
          {t("decline")}
        </button>
        <a className="btn btn--ghost" href="/privacy">
          {t("privacy")}
        </a>
      </div>
    </div>
  );
}
