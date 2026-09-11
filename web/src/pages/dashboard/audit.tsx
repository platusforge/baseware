import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader, DataTable } from "@/components";
import { useOrganization } from "@/contexts/organization-context";

export default function AuditPage() {
  const { current } = useOrganization();
  const [rows, setRows] = useState<{ action: string; createdAt: string }[]>([]);

  useEffect(() => {
    if (current) api.get<typeof rows>(`/organizations/${current.id}/audit`, current.id).then(setRows).catch(() => []);
  }, [current]);

  return (
    <div>
      <PageHeader title="Audit log" />
      <DataTable columns={["action", "at"]} rows={rows.map((r) => [r.action, r.createdAt])} />
    </div>
  );
}
