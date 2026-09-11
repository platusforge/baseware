import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/services/api";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setStatus("error");
      return;
    }
    api.post<{ message: string }>("/auth/verify/confirm", { token })
      .then(() => setStatus("ok"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 60 }}>
      <h1>Email verification</h1>
      {status === "pending" && <p>Verifying…</p>}
      {status === "ok" && <p>Your email is verified. <Link to="/login">Log in</Link></p>}
      {status === "error" && <p>Invalid or expired link. <Link to="/login">Back to login</Link></p>}
    </div>
  );
}
