import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useI18n } from "@/contexts/i18n-context";
import { Alert, Button } from "@/components";

export default function InvitePage() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { t } = useI18n();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const token = params.get("token") ?? "";

  async function accept() {
    if (!token || busy) return;
    setBusy(true);
    try {
      await api.post<{ organizationId: string }>("/invitations/accept", { token });
      setMessage(t("invitationSent"));
      setTimeout(() => nav("/dashboard"), 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Invalid or expired invitation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 60 }}>
      <h1>{t("acceptInvite")}</h1>
      {!token && (
        <Alert variant="danger" role="alert">
          {t("missingToken")}
        </Alert>
      )}
      {token && (
        <>
          <p>{t("boundEmail")}</p>
          <Button type="button" loading={busy} onClick={accept}>
            {t("accept")}
          </Button>
        </>
      )}
      {message && (
        <Alert variant="info" role="status">
          {message}
        </Alert>
      )}
      <p>
        <Link to="/login">{t("login")}</Link> · <Link to="/register">{t("register")}</Link>
      </p>
    </div>
  );
}
