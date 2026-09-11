import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components";
import { useOrganization } from "@/contexts/organization-context";

export default function BillingPage() {
  const { current } = useOrganization();
  const [status, setStatus] = useState<{ plan: string; status: string } | null>(null);

  useEffect(() => {
    if (current) api.get<typeof status>(`/billing/status?orgId=${current.id}`).then(setStatus).catch(() => null);
  }, [current]);

  async function checkout(plan: "starter" | "pro") {
    if (!current) return;
    const s = await api.post<{ url: string }>("/billing/checkout", { organizationId: current.id, plan });
    window.location.href = s.url;
  }

  async function portal() {
    if (!current) return;
    const s = await api.post<{ url: string }>("/billing/portal", { organizationId: current.id });
    window.location.href = s.url;
  }

  return (
    <div>
      <PageHeader title="Billing" subtitle={status ? `${status.plan} · ${status.status}` : undefined} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => checkout("starter")}>Upgrade Starter</button>
        <button className="btn" onClick={() => checkout("pro")}>Upgrade Pro</button>
        <button className="btn btn--ghost" onClick={portal}>Customer portal</button>
      </div>
    </div>
  );
}
