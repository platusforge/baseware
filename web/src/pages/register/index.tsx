import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await api.post<{ message: string }>("/auth/register", { email, password, name });
      setDone(result.message);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>Create account</h1>
      {done ? (
        <p>{done} <Link to="/login">Log in</Link></p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input className="input" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" autoComplete="username" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" autoComplete="new-password" type="password" placeholder="min 12 chars" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button className="btn" type="submit">Register</button>
        </form>
      )}
      <p><Link to="/login">Back to login</Link></p>
    </div>
  );
}
