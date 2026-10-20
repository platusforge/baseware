import { SiteLayout } from "@/components";
import { useSeo } from "@/utils/seo";
import styles from "./legal.module.css";

export default function TermsPage() {
  useSeo("Terms of Service — SaaS Boilerplate", "Terms for using the SaaS Boilerplate starter.");

  return (
    <SiteLayout>
      <article className={styles.doc}>
        <h1>Terms of Service</h1>
        <p className={styles.updated}>
          Last updated: 2026-09-14. This is a starter template — replace with your counsel-reviewed terms before charging.
        </p>
        <h2>1. Service</h2>
        <p>We provide hosted multi-tenant workspaces with per-organization billing via Stripe. Free plans include a 14-day Starter trial for new organizations.</p>
        <h2>2. Acceptable use</h2>
        <p>No abuse, no unlawful content, no credential sharing outside your organization. Seat limits per plan are enforced.</p>
        <h2>3. Billing</h2>
        <p>Subscriptions are per organization. Cancel anytime via the Customer Portal; cancellation takes effect at period end. Failed payments trigger dunning e-mails and in-app notices.</p>
        <h2>4. Data</h2>
        <p>See Privacy and DPA. You can export your data from Settings and delete your account at any time.</p>
        <h2>5. Warranty</h2>
        <p>Service provided as-is to the maximum extent permitted by law.</p>
      </article>
    </SiteLayout>
  );
}
