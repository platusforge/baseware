import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Badge, DataTable, PageHeader, StatCard } from "@/components";
import styles from "./admin.module.css";

type AdminUser = { email: string; type: string };

export default function AdminPage() {
  const [stats, setStats] = useState<{ totalUsers: number } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    api.get<typeof stats>("/admin/stats").then(setStats).catch(() => null);
    api.get<{ items: AdminUser[] }>("/admin/users").then((r) => setUsers(r.items)).catch(() => []);
  }, []);

  return (
    <div>
      <PageHeader title="Admin" subtitle="Platform overview" />
      <div className={styles.stats}>
        <StatCard label="Total users" value={stats ? String(stats.totalUsers) : "—"} />
        <StatCard label="Admins" value={String(users.filter((u) => u.type === "admin").length)} />
      </div>
      <DataTable
        columns={[
          { key: "email", label: "Email", sortable: true },
          {
            key: "type",
            label: "Type",
            render: (u) => <Badge variant={u.type === "admin" ? "primary" : "default"}>{u.type}</Badge>,
          },
        ]}
        data={[...users].sort((a, b) => a.email.localeCompare(b.email))}
        keyOf={(u) => u.email}
        caption="Platform users"
        emptyTitle="No users"
      />
    </div>
  );
}
