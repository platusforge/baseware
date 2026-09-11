import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader, DataTable } from "@/components";

export default function AdminPage() {
  const [stats, setStats] = useState<{ totalUsers: number } | null>(null);
  const [users, setUsers] = useState<{ email: string; type: string }[]>([]);

  useEffect(() => {
    api.get<typeof stats>("/admin/stats").then(setStats).catch(() => null);
    api.get<{ items: typeof users }>("/admin/users").then((r) => setUsers(r.items)).catch(() => []);
  }, []);

  return (
    <div>
      <PageHeader title="Admin" subtitle={stats ? `${stats.totalUsers} users` : undefined} />
      <DataTable columns={["email", "type"]} rows={users.map((u) => [u.email, u.type])} />
    </div>
  );
}
