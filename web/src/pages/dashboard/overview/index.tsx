import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader, StatCard } from "@/components";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

type Status = { plan: string; status: string };

export default function DashboardIndex() {
  const { current } = useOrganization();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status | null>(null);
  const [members, setMembers] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    Promise.all([
      api.get<Status>(`/billing/status?orgId=${current.id}`, current.id).catch(() => null),
      api.get<{ userId: string }[]>(`/organizations/${current.id}/members`, current.id).catch(() => []),
    ])
      .then(([s, m]) => {
        if (s) setStatus(s);
        setMembers(m?.length ?? 0);
      })
      .finally(() => setLoading(false));
  }, [current]);

  return (
    <div>
      <PageHeader title={t("overview")} subtitle={current ? `${current.name} · ${current.plan}` : t("overviewSubtitle")} />
      <div className={styles.grid}>
        <StatCard label="Plan" value={status?.plan ?? current?.plan ?? "—"} loading={loading} />
        <StatCard label={t("members")} value={String(members)} loading={loading} />
        <StatCard label="Status" value={status?.status ?? "—"} loading={loading} />
      </div>
    </div>
  );
}
