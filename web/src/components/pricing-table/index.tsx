import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import { Button, Alert, Spinner } from "@/components";
import styles from "./index.module.css";

type Plan = { id: string; name: string; priceMonthly: number; seats: number; features: string[] };

const FALLBACK: Plan[] = [
  { id: "free", name: "Free", priceMonthly: 0, seats: 1, features: ["1 project", "Community support"] },
  { id: "starter", name: "Starter", priceMonthly: 19, seats: 5, features: ["5 projects", "5 seats", "Email support"] },
  { id: "pro", name: "Pro", priceMonthly: 49, seats: 25, features: ["Unlimited projects", "25 seats", "Priority support", "Audit logs", "API keys"] },
];

function priceLabel(p: Plan): string {
  return p.priceMonthly === 0 ? "$0" : `$${p.priceMonthly}/mo`;
}

export function PricingTable() {
  const { current } = useOrganization();
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<Plan[]>("/billing/plans")
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setPlans(list);
      })
      .catch(() => {
        // keep fallback (backend single source, offline-safe)
      })
      .finally(() => setLoading(false));
  }, []);

  async function subscribe(plan: string) {
    if (plan === "free" || busy) return;
    if (!current) {
      window.location.href = "/register";
      return;
    }
    setBusy(plan);
    setError("");
    try {
      const session = await api.post<{ url: string }>("/billing/checkout", { organizationId: current.id, plan }, current.id);
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setBusy(null);
    }
  }

  return (
    <div>
      <p>{t("trial")}</p>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {loading ? (
        <Spinner label={t("loading")} />
      ) : (
        <div className={styles.grid}>
          {plans.map((p) => (
            <div key={p.id} className={`card ${styles.card}`}>
              <h3>{p.name}</h3>
              <p className={styles.price}>{priceLabel(p)}</p>
              <ul className={styles.features}>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Button type="button" disabled={busy !== null} loading={busy === p.id} className={styles.cta} onClick={() => subscribe(p.id)}>
                {t("choose")} {p.name}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
