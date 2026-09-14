import { Link } from "react-router-dom";

export default function DpaPage() {
  return (
    <div className="container" style={{ maxWidth: 760, paddingTop: 40, paddingBottom: 40 }}>
      <Link to="/">Back</Link>
      <h1>Data Processing Addendum (starter)</h1>
      <p>Processor processes personal data only on documented controller instructions, with appropriate technical measures: bcrypt-12, HttpOnly cookies, TLS in prod, RBAC, audit logs, daily backups.</p>
      <h2>Sub-processors</h2>
      <ul>
        <li>Stripe (billing), Resend (e-mail), S3-compatible storage, PostHog (analytics, consent-gated), Sentry (errors, optional).</li>
      </ul>
      <p>Replace sub-processor list and transit/retention clauses with counsel review before enterprise sales.</p>
    </div>
  );
}
