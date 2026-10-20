import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { Alert, AuthCard, Button, Spinner } from "@/components";
import styles from "./index.module.css";

export default function InvitePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token") ?? "";
  const nextPath = `/invite?token=${encodeURIComponent(token)}`;

  async function accept() {
    if (!token || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.post<{ organizationId: string }>("/invitations/accept", { token });
      setAccepted(true);
      setTimeout(() => nav("/dashboard"), 1200);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(raw === "Invalid or expired invitation." ? t("inviteInvalid") : raw || t("inviteInvalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title={t("acceptInvite")}
      subtitle={token ? t("boundEmail") : undefined}
      footer={
        <>
          <Link to="/login">{t("login")}</Link> · <Link to="/register">{t("register")}</Link>
        </>
      }
    >
      {!token && (
        <Alert variant="danger" role="alert">
          {t("missingToken")}
        </Alert>
      )}
      {token && accepted && (
        <Alert variant="success" role="status">
          {t("inviteAccepted")}
        </Alert>
      )}
      {token && !accepted && authLoading && (
        <div className={styles.loading}>
          <Spinner label={t("loading")} />
        </div>
      )}
      {token && !accepted && !authLoading && !user && (
        <>
          <Alert variant="info">{t("inviteLoginPrompt")}</Alert>
          <Link className={styles.primaryAction} to={`/login?next=${encodeURIComponent(nextPath)}`}>
            {t("login")}
          </Link>
        </>
      )}
      {token && !accepted && !authLoading && user && (
        <>
          {error && (
            <Alert variant="danger" role="alert">
              {error}
            </Alert>
          )}
          <Button type="button" loading={busy} onClick={accept} fullWidth>
            {t("accept")}
          </Button>
        </>
      )}
    </AuthCard>
  );
}
