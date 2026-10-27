import { SiteLayout } from "@/components";
import { useSeo } from "@/utils/seo";
import styles from "./legal.module.css";

export default function PrivacyPage() {
  useSeo("Privacy Policy — DevKit", "How the DevKit starter handles personal data (LGPD / GDPR ready).");

  return (
    <SiteLayout>
      <article className={styles.doc}>
        <h1>Privacy Policy (LGPD / GDPR ready starter)</h1>
        <p className={styles.updated}>Last updated: 2026-09-14. Replace with your counsel-reviewed policy before launch.</p>
        <h2>Data we process</h2>
        <ul>
          <li>Account: e-mail, name, auth metadata, MFA status (never passwords in plain text — bcrypt-12 only).</li>
          <li>Workspace: organizations, memberships, invites, audit logs, API-key metadata.</li>
          <li>Billing: Stripe customer/subscription ids, plan, status (card data stays with Stripe).</li>
          <li>Analytics: PostHog only after you grant consent in the cookie banner. Sentry for errors when configured.</li>
        </ul>
        <h2>Your rights</h2>
        <p>Access, correction, portability and deletion. Use Settings → Export my data, or Delete my account. Audit rows keep a null author after deletion.</p>
        <h2>Retention</h2>
        <p>Tokens/invites are purged hourly. Refresh tokens revoked &gt;30d are purged. Backups retained 7 days locally (extend to offsite per runbook).</p>
        <h2>Contact</h2>
        <p>Privacy contact: add your DPO e-mail here before launch.</p>
      </article>
    </SiteLayout>
  );
}
