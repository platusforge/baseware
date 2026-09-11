import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { Badge, Button, DataTable, Input, PageHeader, SearchBar, toast, type Column, type SortDir } from "@/components";
import { useOrganization } from "@/contexts/organization-context";
import styles from "./members.module.css";

type Member = { userId: string; email: string; role: string };

const ROLE_VARIANT: Record<string, "primary" | "info" | "default"> = {
  owner: "primary",
  admin: "info",
  member: "default",
};

export default function MembersPage() {
  const { current } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);

  useEffect(() => {
    if (current) api.get<Member[]>(`/organizations/${current.id}/members`, current.id).then(setMembers).catch(() => []);
  }, [current]);

  async function invite() {
    if (!current || !email.trim()) return;
    try {
      await api.post(`/organizations/${current.id}/invitations`, { email: email.trim(), role: "member" }, current.id);
      setEmail("");
      toast.success("Invitation sent");
    } catch {
      toast.error("Could not send the invitation");
    }
  }

  const columns: Column<Member>[] = useMemo(() => [
    { key: "email", label: "Email", sortable: true },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (m) => <Badge variant={ROLE_VARIANT[m.role] ?? "default"} dot>{m.role}</Badge>,
    },
  ], []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? members.filter((m) => m.email.toLowerCase().includes(q) || m.role.includes(q)) : [...members];
    if (sort) {
      filtered.sort((a, b) => {
        const av = a[sort.key as keyof Member] ?? "";
        const bv = b[sort.key as keyof Member] ?? "";
        return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return filtered;
  }, [members, query, sort]);

  function handleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div>
      <PageHeader title="Members" subtitle={current ? `${members.length} people in ${current.name}` : undefined} />
      <form
        className={styles.invite}
        onSubmit={(e) => { e.preventDefault(); invite(); }}
      >
        <Input label="Invite by email" placeholder="teammate@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit">Invite</Button>
      </form>
      <div className={styles.toolbar}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search members..." debounceMs={200} />
      </div>
      <DataTable
        columns={columns}
        data={rows}
        keyOf={(m) => m.userId}
        sort={sort}
        onSort={handleSort}
        caption="Organization members"
        emptyTitle="No members found"
        emptyHint={query ? "Try a different search." : "Invite your first teammate above."}
      />
    </div>
  );
}
