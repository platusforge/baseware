import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { translateApiError } from "@/utils/api-errors";
import { Alert, AuthCard, Button, Input } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

export default function RegisterPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);
  const next = params.get("next");
  const loginHref = next && next.startsWith("/") && !next.startsWith("//") ? `/login?next=${encodeURIComponent(next)}` : "/login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/register", { email, password, name });
      setDone(t("registerSuccess"));
    } catch (err) {
      setError(translateApiError(err instanceof Error ? err.message : "", t, "registerFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title={t("createAccount")}
      subtitle={t("registerSubtitle")}
      footer={<>{t("haveAccount")} <Link to={loginHref}>{t("login")}</Link></>}
    >
      {done ? (
        <Alert variant="success">
          {done} <Link to={loginHref}>{t("login")}</Link>
        </Alert>
      ) : (
        <form onSubmit={submit} className={styles.form}>
          <Input label={t("name")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t("email")} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label={t("newPassword")}
            hint={t("resetConfirmSubtitle")}
            autoComplete="new-password"
            type="password"
            required
            minLength={12}
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
            {t("register")}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
