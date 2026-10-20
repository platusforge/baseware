import { useState, useMemo, useEffect } from "react";
import { api } from "@/services/api";
import { Badge, DataTable, PageHeader, SearchBar } from "@/components";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import { useDataTableLabels } from "@/i18n/use-data-table-labels";
import { formatDateTime } from "@/utils/dates";
import styles from "./index.module.css";

type AuditRow = { id: string; action: string; createdAt: string };

function variantFor(action: string): "danger" | "warning" | "success" | "default" {
  if (/delete|cancel|revoke|fail/i.test(action)) return "danger";
  if (/invite|update|change/i.test(action)) return "warning";
  if (/create|accept|complete/i.test(action)) return "success";
  return "default";
}

export default function AuditPage() {
  const { current } = useOrganization();
  const { t, lang } = useI18n();
  const tableLabels = useDataTableLabels();
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
      <PageHeader title={t("auditLog")} subtitle={current ? `${t("activityIn")} ${current.name}` : undefined} />
      <div className={styles.toolbar}>
        <SearchBar value={query} onChange={setQuery} placeholder={t("filterActions")} debounceMs={200} clearLabel={t("clearSearch")} />
      </div>
      <DataTable
        columns={[
          {
            key: "action",
            label: t("action"),
            render: (r) => <Badge variant={variantFor(r.action)}>{r.action}</Badge>,
          },
          {
            key: "createdAt",
            label: t("when"),
            hideOnMobile: true,
            render: (r) => formatDateTime(r.createdAt, lang),
          },
        ]}
        data={filtered}
        keyOf={(r) => r.id}
        loading={loading}
        caption={t("auditLog")}
        emptyTitle={t("noActivity")}
        emptyHint={query ? t("filterHint") : t("auditHint")}
        labels={tableLabels}
      />
    </div>
  );
}
