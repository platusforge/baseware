import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type Provider = { provider: string; configured: boolean };

const ERROR_MESSAGES: Record<string, string> = {
  "account-exists": "An account with this email already exists. Log in with your password, then link it.",
  "oauth-failed": "Social login failed. Try again or use email.",
  "provider-unconfigured": "This login method is not enabled.",
};

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    const err = params.get("error");
    if (err) setError(ERROR_MESSAGES[err] ?? "Login failed.");
  }, [params]);

  useEffect(() => {
    fetch(`${API_URL}/auth/oauth/providers`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list: Provider[]) => setProviders(list.filter((p) => p.configured)))
      .catch(() => []);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      nav("/dashboard");
    } catch {
      setError("Invalid credentials.");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>Login</h1>
      {providers.length > 0 && (
        <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
          {providers.map((p) => (
            <a key={p.provider} className="btn btn--ghost" href={`${API_URL}/auth/oauth/${p.provider}`}>
              {p.provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
              Continue with {p.provider === "google" ? "Google" : "GitHub"}
            </a>
          ))}
        </div>
      )}
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input className="input" autoComplete="username" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" autoComplete="current-password" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button className="btn" type="submit">Login</button>
      </form>
      <p><Link to="/register">Create account</Link> · <Link to="/reset-password">Forgot password?</Link></p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.6-2.8-.1.1C.5 8.7 0 10.3 0 12s.5 3.3 1.4 4.7l3.8-2.3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.4 6.7l3.8 2.9c1-2.9 3.7-4.9 6.8-4.9z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }} aria-hidden="true">
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C16.4 4.9 17.4 5.2 17.4 5.2c.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5z" />
    </svg>
  );
}
