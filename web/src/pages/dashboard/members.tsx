import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader, DataTable } from "@/components";
import { useOrganization } from "@/contexts/organization-context";

export default function MembersPage() {
  const { current } = useOrganization();
  const [members, setMembers] = useState<{ userId: string; email: string; role: string }[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (current) api.get<typeof members>(`/organizations/${current.id}/members`, current.id).then(setMembers).catch(() => []);
  }, [current]);

  async function invite() {
    if (!current) return;
    await api.post(`/organizations/${current.id}/invitations`, { email, role: "member" }, current.id);
    setEmail("");
  }

  return (
    <div>
      <PageHeader title="Members" />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="email to invite" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn" onClick={invite}>Invite</button>
      </div>
      <DataTable columns={["email", "role"]} rows={members.map((m) => [m.email, m.role])} />
    </div>
  );
}
