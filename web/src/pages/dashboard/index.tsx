import { PageHeader } from "@/components";
import { useOrganization } from "@/contexts/organization-context";

export default function DashboardIndex() {
  const { current } = useOrganization();
  return (
    <div>
      <PageHeader title="Overview" subtitle={current ? `${current.name} · ${current.plan}` : "No organization yet"} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        {[["MRR", "$—"], ["Active users", "—"], ["API calls", "—"]].map(([k, v]) => (
          <div key={k} className="card"><small>{k}</small><h2>{v}</h2></div>
        ))}
      </div>
    </div>
  );
}
