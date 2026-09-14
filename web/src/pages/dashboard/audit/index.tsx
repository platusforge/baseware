import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { Badge, DataTable, PageHeader, SearchBar } from "@/components";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

type AuditRow = { action: string; createdAt: string };

function variantFor(action: string): "danger" | "warning" | "success" | "default" {
  if (/delete|cancel|revoke|fail/i.test(action)) return "danger";
  if (/invite|update|change/i.test(action)) return "warning";
  if (/create|accept|complete/i.test(action)) return "success";
  return "default";
}

export default function AuditPage() {
  const { current } = useOrganization();
  const { t } = useI18n();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    api
      .get<AuditRow[]>(`/organizations/${current.id}/audit`, current.id)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [current]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.action.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  return (
    <div>
      <PageHeader title={t("auditLog")} subtitle={current ? `Activity in ${current.name}` : undefined} />
      <div className={styles.toolbar}>
        <SearchBar value={query} onChange={setQuery} placeholder={t("filterActions")} debounceMs={200} />
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
        loading={loading}
        caption={t("auditLog")}
        emptyTitle={t("noActivity")}
        emptyHint={query ? "Try a different filter." : t("auditHint")}
      />
    </div>
  );
}
