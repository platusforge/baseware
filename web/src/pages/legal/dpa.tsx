import { SiteLayout } from "@/components";
import { useSeo } from "@/utils/seo";
import styles from "./legal.module.css";

export default function DpaPage() {
  useSeo("Data Processing Addendum — SaaS Boilerplate", "Starter DPA for the SaaS Boilerplate.");

  return (
    <SiteLayout>
      <article className={styles.doc}>
        <h1>Data Processing Addendum (starter)</h1>
        <p>
          Processor processes personal data only on documented controller instructions, with appropriate technical measures: bcrypt-12, HttpOnly
          cookies, TLS in prod, RBAC, audit logs, daily backups.
        </p>
        <h2>Sub-processors</h2>
        <ul>
          <li>Stripe (billing), Resend (e-mail), S3-compatible storage, PostHog (analytics, consent-gated), Sentry (errors, optional).</li>
        </ul>
        <p>Replace sub-processor list and transit/retention clauses with counsel review before enterprise sales.</p>
      </article>
    </SiteLayout>
  );
}
