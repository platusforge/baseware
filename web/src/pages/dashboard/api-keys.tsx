import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { PageHeader, DataTable } from "@/components";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<{ id: string; name: string; keyPrefix: string }[]>([]);
  const [name, setName] = useState("");
  const [created, setCreated] = useState("");

  async function reload() {
    setKeys(await api.get<typeof keys>("/api-keys").catch(() => []));
  }
  useEffect(() => { reload(); }, []);

  async function create() {
    const r = await api.post<{ apiKey: string }>("/api-keys", { name });
    setCreated(r.apiKey);
    setName("");
    reload();
  }

  return (
    <div>
      <PageHeader title="API Keys" subtitle="Copy the secret once — only the hash is stored." />
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input className="input" placeholder="key name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" onClick={create}>Create</button>
      </div>
      {created && <p className="card">New key: <code>{created}</code></p>}
      <DataTable columns={["name", "prefix"]} rows={keys.map((k) => [k.name, k.keyPrefix])} />
    </div>
  );
}
