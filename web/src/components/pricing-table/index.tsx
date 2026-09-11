import { api } from "@/services/api";
import { useOrganization } from "@/contexts/organization-context";

const PLANS = [
  { id: "free", name: "Free", price: "$0", features: ["1 project", "Community support"] },
  { id: "starter", name: "Starter", price: "$19/mo", features: ["5 projects", "5 seats", "Email support"] },
  { id: "pro", name: "Pro", price: "$49/mo", features: ["Unlimited projects", "25 seats", "Audit logs", "API keys"] },
];

export function PricingTable() {
  const { current } = useOrganization();

  async function subscribe(plan: string) {
    if (plan === "free") return;
    if (!current) {
      window.location.href = "/register";
      return;
    }
    const session = await api.post<{ url: string }>("/billing/checkout", { organizationId: current.id, plan });
    window.location.href = session.url;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
      {PLANS.map((p) => (
        <div key={p.id} className="card">
          <h3>{p.name}</h3>
          <p style={{ fontSize: 24, fontWeight: 700 }}>{p.price}</p>
          <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
          <button className="btn" onClick={() => subscribe(p.id)}>Choose {p.name}</button>
        </div>
      ))}
    </div>
  );
}
