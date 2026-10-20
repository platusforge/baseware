import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/i18n-context";
import { PricingTable, SiteFooter, SiteHeader } from "@/components";
import { useSeo } from "@/utils/seo";
import styles from "./index.module.css";

export default function LandingPage() {
  const { t } = useI18n();
  useSeo("SaaS Boilerplate — Ship your SaaS faster", t("landingLead"));

  const features = [
    { icon: <UsersIcon />, title: t("featOrgsTitle"), desc: t("featOrgsDesc") },
    { icon: <CardIcon />, title: t("featBillingTitle"), desc: t("featBillingDesc") },
    { icon: <ShieldIcon />, title: t("featRbacTitle"), desc: t("featRbacDesc") },
    { icon: <KeyIcon />, title: t("featKeysTitle"), desc: t("featKeysDesc") },
    { icon: <MailIcon />, title: t("featEmailTitle"), desc: t("featEmailDesc") },
    { icon: <BoxIcon />, title: t("featDockerTitle"), desc: t("featDockerDesc") },
  ];

  const faqs = [
    { q: t("faqOrgQ"), a: t("faqOrgA") },
    { q: t("faqAuthQ"), a: t("faqAuthA") },
    { q: t("faqTrialQ"), a: t("faqTrialA") },
  ];

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main>
        <section className={styles.hero}>
          <span className={styles.badge}>{t("trial")}</span>
          <h1 className={styles.title}>{t("hero")}</h1>
          <p className={styles.lead}>{t("landingLead")}</p>
          <div className={styles.ctas}>
            <Link to="/register" className={styles.primary}>
              {t("cta")}
            </Link>
            <Link to="/pricing" className={styles.ghost}>
              {t("pricing")}
            </Link>
          </div>
        </section>

        <section id="features" className={styles.section}>
          <div className={styles.features}>
            {features.map((f) => (
              <article key={f.title} className={styles.feature}>
                <span className={styles.icon} aria-hidden="true">
                  {f.icon}
                </span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("pricing")}</h2>
          <PricingTable />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("faq")}</h2>
          <div className={styles.faq}>
            {faqs.map((f) => (
              <details key={f.q} className={styles.faqItem}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M15 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 10-10m-4 4 3 3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 6 10-6" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 2 9 5v10l-9 5-9-5V7z" />
      <path d="m12 12 9-5M12 12 3 7M12 12v10" />
    </svg>
  );
}
