import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { Badge, DataTable, PageHeader, SearchBar } from "@/components";
import { useOrganization } from "@/contexts/organization-context";

type AuditRow = { action: string; createdAt: string };

function variantFor(action: string): "danger" | "warning" | "success" | "default" {
  if (/delete|cancel|revoke|fail/i.test(action)) return "danger";
  if (/invite|update|change/i.test(action)) return "warning";
  if (/create|accept|complete/i.test(action)) return "success";
  return "default";
}

export default function AuditPage() {
  const { current } = useOrganization();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (current) api.get<AuditRow[]>(`/organizations/${current.id}/audit`, current.id).then(setRows).catch(() => []);
  }, [current]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.action.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  return (
    <div>
      <PageHeader title="Audit log" subtitle={current ? `Activity in ${current.name}` : undefined} />
      <div style={{ marginBottom: 12, maxWidth: 360 }}>
        <SearchBar value={query} onChange={setQuery} placeholder="Filter actions..." debounceMs={200} />
      </div>
      <DataTable
        columns={[
          {
            key: "action",
            label: "Action",
            render: (r) => <Badge variant={variantFor(r.action)}>{r.action}</Badge>,
          },
          { key: "createdAt", label: "At", hideOnMobile: true },
        ]}
        data={filtered}
        keyOf={(_, i) => `${i}`}
        caption="Audit log"
        emptyTitle="No activity yet"
        emptyHint={query ? "Try a different filter." : "Actions in this organization will show up here."}
      />
    </div>
  );
}
