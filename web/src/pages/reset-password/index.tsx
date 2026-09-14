import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { Input, Button, Alert } from "@/components";
import { useI18n } from "@/contexts/i18n-context";

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
      setError(err instanceof Error ? err.message : "Error");
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
      setError(err instanceof Error ? err.message : t("resetInvalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>{token ? t("resetTitleConfirm") : t("resetTitle")}</h1>
      {done ? (
        <Alert variant="success">
          {done} <Link to="/login">{t("login")}</Link>
        </Alert>
      ) : token ? (
        <form onSubmit={confirmReset} style={{ display: "grid", gap: 12 }}>
          <Input
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Alert variant="danger" role="alert">
              {error}
            </Alert>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? t("loading") : t("resetConfirm")}
          </Button>
        </form>
      ) : (
        <form onSubmit={requestLink} style={{ display: "grid", gap: 12 }}>
          <Input
            label={t("email")}
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && (
            <Alert variant="danger" role="alert">
              {error}
            </Alert>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? t("loading") : t("resetSend")}
          </Button>
        </form>
      )}
      <p>
        <Link to="/login">{t("backToLogin")}</Link>
      </p>
    </div>
  );
}
