import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Badge, DataTable, PageHeader, StatCard } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

type AdminUser = { email: string; type: string };

export default function AdminPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<{ totalUsers: number } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<typeof stats>("/admin/stats").catch(() => null),
      api.get<{ items: AdminUser[] }>("/admin/users").catch(() => ({ items: [] as AdminUser[] })),
    ])
      .then(([s, r]) => {
        setStats(s);
        setUsers(r?.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title={t("admin")} subtitle="Platform overview" />
      <div className={styles.stats}>
        <StatCard label="Total users" value={stats ? String(stats.totalUsers) : "—"} loading={loading} />
        <StatCard label="Admins" value={String(users.filter((u) => u.type === "admin").length)} loading={loading} />
      </div>
      <DataTable
        columns={[
          { key: "email", label: t("email"), sortable: true },
          {
            key: "type",
            label: "Type",
            render: (u) => <Badge variant={u.type === "admin" ? "primary" : "default"}>{u.type}</Badge>,
          },
        ]}
        data={[...users].sort((a, b) => a.email.localeCompare(b.email))}
        keyOf={(u) => u.email}
        loading={loading}
        caption="Platform users"
        emptyTitle="No users"
      />
    </div>
  );
}
