import { PricingTable, SiteLayout } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import { useSeo } from "@/utils/seo";
import styles from "./index.module.css";

export default function PricingPage() {
  const { t } = useI18n();
  useSeo("Pricing — Baseware", t("pricingSubtitle"));

  return (
    <SiteLayout width="lg">
      <header className={styles.head}>
        <h1>{t("pricing")}</h1>
        <p>{t("pricingSubtitle")}</p>
      </header>
      <PricingTable />
    </SiteLayout>
  );
}
