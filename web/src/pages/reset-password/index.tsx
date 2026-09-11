import { useState } from "react";
import { api } from "@/services/api";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/auth/reset/request", { email });
    setDone(true);
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>Reset password</h1>
      {done ? <p>If the account exists, a reset link was sent.</p> : (
        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input className="input" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" type="submit">Send link</button>
        </form>
      )}
    </div>
  );
}
