import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { Alert, Button, Input } from "@/components";
import { useI18n } from "@/contexts/i18n-context";

export default function RegisterPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.post<{ message: string }>("/auth/register", { email, password, name });
      setDone(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>{t("createAccount")}</h1>
      {done ? (
        <Alert variant="success">
          {done} <Link to="/login">{t("login")}</Link>
        </Alert>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <Input label={t("name")} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={t("email")} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label={t("newPassword")}
            autoComplete="new-password"
            type="password"
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
          <Button type="submit" loading={loading}>
            {t("register")}
          </Button>
        </form>
      )}
      <p>
        <Link to="/login">{t("backToLogin")}</Link>
      </p>
    </div>
  );
}
