import { useState } from "react";
import { api } from "@/services/api";
import { PageHeader } from "@/components";
import { useOrganization } from "@/contexts/organization-context";

export default function SettingsPage() {
  const { current, reload } = useOrganization();
  const [name, setName] = useState("");

  async function createOrg() {
    await api.post("/organizations", { name });
    setName("");
    reload();
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle={current?.name} />
      <div className="card">
        <h3>New organization</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" placeholder="org name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" onClick={createOrg}>Create</button>
        </div>
      </div>
    </div>
  );
}
