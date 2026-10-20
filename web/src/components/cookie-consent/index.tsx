import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/i18n-context";
import { Button } from "@/components/button";
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
    <div role="dialog" aria-label="Cookie consent" aria-live="polite" className={styles.banner}>
      <strong>{t("consentTitle")}</strong>
      <p>{t("consentBody")}</p>
      <div className={styles.actions}>
        <Button size="sm" onClick={() => choose("granted")}>
          {t("accept")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => choose("denied")}>
          {t("decline")}
        </Button>
        <Link className={styles.link} to="/privacy">
          {t("privacy")}
        </Link>
      </div>
    </div>
  );
}
