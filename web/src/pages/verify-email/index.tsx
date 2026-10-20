import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { Alert, AuthCard, Spinner } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api
      .post<{ message: string }>("/auth/verify/confirm", { token })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <AuthCard title={t("verifyEmail")} subtitle={t("verifySubtitle")} footer={<Link to="/login">{t("backToLogin")}</Link>}>
      {status === "pending" && (
        <div className={styles.loading}>
          <Spinner label={t("verifying")} />
        </div>
      )}
      {status === "ok" && (
        <Alert variant="success">
          {t("emailVerified")} <Link to="/login">{t("login")}</Link>
        </Alert>
      )}
      {status === "error" && (
        <Alert variant="danger" role="alert">
          {t("emailInvalid")} <Link to="/login">{t("backToLogin")}</Link>
        </Alert>
      )}
    </AuthCard>
  );
}
