import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Alert, Button, DataTable, PageHeader, Spinner } from "@/components";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

type Status = { plan: string; status: string; trialEndsAt?: string | null };
type Invoice = { id: string; amount: number; currency: string; status: string; created: number; pdfUrl: string | null };

export default function BillingPage() {
  const { current } = useOrganization();
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Status | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<"starter" | "pro" | "portal" | null>(null);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    Promise.all([
      api.get<Status>(`/billing/status?orgId=${current.id}`, current.id).catch(() => null),
      api.get<Invoice[]>("/billing/invoices", current.id).catch(() => [] as Invoice[]),
    ])
      .then(([s, inv]) => {
        if (s) setStatus(s);
        setInvoices(inv ?? []);
      })
      .finally(() => setLoading(false));
  }, [current]);

  async function checkout(plan: "starter" | "pro") {
    if (!current || busy) return;
    setBusy(plan);
    setError("");
    try {
      const s = await api.post<{ url: string }>("/billing/checkout", { organizationId: current.id, plan }, current.id);
      window.location.href = s.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkoutFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function portal() {
    if (!current || busy) return;
    setBusy("portal");
    setError("");
    try {
      const s = await api.post<{ url: string }>("/billing/portal", { organizationId: current.id }, current.id);
      window.location.href = s.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("checkoutFailed"));
      setBusy(null);
    }
  }

  const trialActive = status?.status === "trialing" && status?.trialEndsAt;

  return (
    <div>
      <PageHeader title={t("billing")} subtitle={status ? `${status.plan} · ${status.status}` : undefined} />
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      {trialActive && (
        <Alert variant="info" title={t("trialActive")}>
          Starter trial ends {new Date(status.trialEndsAt as string).toLocaleDateString(lang)}. Add a payment method to keep
          Pro features.
        </Alert>
      )}
      <div className={styles.actions}>
        <Button type="button" disabled={busy !== null} onClick={() => checkout("starter")}>
          {busy === "starter" ? t("loading") : t("upgradeStarter")}
        </Button>
        <Button type="button" disabled={busy !== null} onClick={() => checkout("pro")}>
          {busy === "pro" ? t("loading") : t("upgradePro")}
        </Button>
        <Button type="button" variant="ghost" disabled={busy !== null} onClick={portal}>
          {busy === "portal" ? t("loading") : t("portal")}
        </Button>
      </div>
      <h3>{t("invoices")}</h3>
      {loading ? (
        <Spinner label={t("loading")} />
      ) : (
        <div className={styles.tableScroll}>
          <DataTable
            columns={[
              { key: "id", label: "ID", render: (r) => `${r.id.slice(0, 12)}…` },
              {
                key: "amount",
                label: "Amount",
                render: (r) => `${(r.amount / 100).toFixed(2)} ${r.currency.toUpperCase()}`,
              },
              { key: "status", label: "Status" },
              {
                key: "created",
                label: "Date",
                render: (r) => new Date(r.created * 1000).toLocaleDateString(lang),
              },
              {
                key: "pdfUrl",
                label: "PDF",
                render: (r) =>
                  r.pdfUrl ? (
                    <a href={r.pdfUrl} target="_blank" rel="noreferrer" aria-label={`Invoice ${r.id} PDF`}>
                      PDF
                    </a>
                  ) : (
                    "—"
                  ),
              },
            ]}
            data={invoices}
            keyOf={(r) => r.id}
            caption={t("invoices")}
            emptyTitle={t("noInvoices")}
            responsive="scroll"
          />
        </div>
      )}
    </div>
  );
}
