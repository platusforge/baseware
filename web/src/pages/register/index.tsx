import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/services/api";

export default function RegisterPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/auth/register", { email, password, name });
      nav("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>Create account</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <input className="input" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" autoComplete="username" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" autoComplete="new-password" type="password" placeholder="min 12 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button className="btn" type="submit">Register</button>
      </form>
      <p><Link to="/login">Back to login</Link></p>
    </div>
  );
}
