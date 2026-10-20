import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { friendlyAuthError } from "@/utils/auth-errors";
import { Input, Button, Alert, AuthCard } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const token = params.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await api.post<{ message: string }>("/auth/reset/request", { email });
      setDone(r.message);
    } catch (err) {
      setError(friendlyAuthError(err instanceof Error ? err.message : "", t));
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await api.post<{ message: string }>("/auth/reset/confirm", { token, password });
      setDone(r.message);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(raw === "Invalid or expired token." ? t("resetInvalid") : friendlyAuthError(raw, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={token ? t("resetTitleConfirm") : t("resetTitle")}
      subtitle={token ? t("resetConfirmSubtitle") : t("resetSubtitle")}
      footer={<Link to="/login">{t("backToLogin")}</Link>}
    >
      {done ? (
        <Alert variant="success">
          {done} <Link to="/login">{t("login")}</Link>
        </Alert>
      ) : token ? (
        <form onSubmit={confirmReset} className={styles.form}>
          <Input
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            revealLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
          {error && (
            <Alert variant="danger" role="alert">
              {error}
            </Alert>
          )}
          <Button type="submit" loading={loading} fullWidth>
            {t("resetConfirm")}
          </Button>
        </form>
      ) : (
        <form onSubmit={requestLink} className={styles.form}>
          <Input
            label={t("email")}
            type="email"
            autoComplete="username"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <Alert variant="danger" role="alert">
              {error}
            </Alert>
          )}
          <Button type="submit" loading={loading} fullWidth>
            {t("resetSend")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
