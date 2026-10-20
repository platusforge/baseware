import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { Badge, DataTable, PageHeader, SearchBar, StatCard, type Column, type SortDir } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import { useDataTableLabels } from "@/i18n/use-data-table-labels";
import { formatDate } from "@/utils/dates";
import styles from "./index.module.css";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  type: string;
  active: boolean;
  mfaEnabled: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
};

function sortValue(user: AdminUser, key: string): string | number {
  switch (key) {
    case "name":
      return (user.name ?? "").toLowerCase();
    case "email":
      return user.email.toLowerCase();
    case "type":
      return user.type;
    case "emailVerifiedAt":
      return user.emailVerifiedAt ? 1 : 0;
    case "mfaEnabled":
      return user.mfaEnabled ? 1 : 0;
    case "active":
      return user.active ? 1 : 0;
    case "createdAt":
      return new Date(user.createdAt).getTime();
    default:
      return "";
  }
}

export default function AdminPage() {
  const { t, lang } = useI18n();
  const tableLabels = useDataTableLabels();
  const [stats, setStats] = useState<{ totalUsers: number } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<typeof stats>("/admin/stats").catch(() => null),
      api.get<{ items: AdminUser[]; total: number }>("/admin/users?take=100").catch(() => ({ items: [] as AdminUser[], total: 0 })),
    ])
      .then(([s, r]) => {
        setStats(s);
        setUsers(r?.items ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<AdminUser>[] = useMemo(
    () => [
      { key: "name", label: t("name"), sortable: true, render: (u) => u.name ?? "—" },
      { key: "email", label: t("email"), sortable: true, copyable: true },
      {
        key: "type",
        label: t("userType"),
        sortable: true,
        copyable: true,
        render: (u) => <Badge variant={u.type === "admin" ? "primary" : "default"}>{u.type}</Badge>,
      },
      {
        key: "emailVerifiedAt",
        label: t("verified"),
        sortable: true,
        render: (u) => (
          <Badge variant={u.emailVerifiedAt ? "success" : "warning"}>
            {u.emailVerifiedAt ? t("verified") : t("unverifiedLabel")}
          </Badge>
        ),
        value: (u) => (u.emailVerifiedAt ? t("verified") : t("unverifiedLabel")),
      },
      {
        key: "mfaEnabled",
        label: t("mfaShort"),
        sortable: true,
        render: (u) => <Badge variant={u.mfaEnabled ? "success" : "default"}>{u.mfaEnabled ? t("enabled") : t("disabled")}</Badge>,
        value: (u) => (u.mfaEnabled ? t("enabled") : t("disabled")),
      },
      {
        key: "active",
        label: t("status"),
        sortable: true,
        render: (u) => (
          <Badge variant={u.active ? "success" : "danger"} dot>
            {u.active ? t("isActive") : t("isInactive")}
          </Badge>
        ),
        value: (u) => (u.active ? t("isActive") : t("isInactive")),
      },
      {
        key: "createdAt",
        label: t("createdAtLabel"),
        sortable: true,
        hideOnMobile: true,
        render: (u) => formatDate(u.createdAt, lang),
        value: (u) => formatDate(u.createdAt, lang),
      },
    ],
    [t, lang],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            (u.name ?? "").toLowerCase().includes(q) ||
            u.type.toLowerCase().includes(q),
        )
      : [...users];
    if (sort) {
      filtered.sort((a, b) => {
        const av = sortValue(a, sort.key);
        const bv = sortValue(b, sort.key);
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return filtered;
  }, [users, query, sort]);

  const admins = users.filter((u) => u.type === "admin").length;

  return (
    <div>
      <PageHeader title={t("admin")} subtitle={t("platformOverview")} />
      <div className={styles.stats}>
        <StatCard label={t("totalUsers")} value={stats ? String(stats.totalUsers) : "—"} loading={loading} />
        <StatCard label={t("admins")} value={String(admins)} loading={loading} />
      </div>
      <DataTable
        columns={columns}
        data={rows}
        keyOf={(u) => u.id}
        sort={sort}
        onSort={(key) => setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }))}
        loading={loading}
        caption={t("platformUsers")}
        emptyTitle={t("noUsers")}
        emptyHint={query ? t("searchHint") : t("noUsersHint")}
        toolbar={<SearchBar value={query} onChange={setQuery} placeholder={t("adminSearch")} debounceMs={200} clearLabel={t("clearSearch")} />}
        columnManager
        storageKey="admin-users-table"
        exportable
        exportFileName="platform-users"
        labels={tableLabels}
      />
    </div>
  );
}
