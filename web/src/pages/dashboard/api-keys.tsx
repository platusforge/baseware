import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Alert, Button, DataTable, IconButton, Input, Modal, PageHeader, toast } from "@/components";

type ApiKey = { id: string; name: string; keyPrefix: string };

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [created, setCreated] = useState("");
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  async function reload() {
    setKeys(await api.get<ApiKey[]>("/api-keys").catch(() => []));
  }
  useEffect(() => { reload(); }, []);

  async function create() {
    if (!name.trim()) return;
    try {
      const r = await api.post<{ apiKey: string }>("/api-keys", { name: name.trim() });
      setCreated(r.apiKey);
      setName("");
      reload();
    } catch {
      toast.error("Could not create the key");
    }
  }

  async function revoke() {
    if (!revoking) return;
    try {
      await api.del(`/api-keys/${revoking.id}`);
      toast.success("Key revoked");
      setRevoking(null);
      reload();
    } catch {
      toast.error("Could not revoke the key");
    }
  }

  return (
    <div>
      <PageHeader title="API Keys" subtitle="Copy the secret once — only the hash is stored." />
      <form
        style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "end", marginBottom: 16 }}
        onSubmit={(e) => { e.preventDefault(); create(); }}
      >
        <Input label="New key name" placeholder="ci-deploy" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">Create</Button>
      </form>
      {created && (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="success" title="Key created — copy it now" onDismiss={() => setCreated("")}>
            <code>{created}</code>
          </Alert>
        </div>
      )}
      <DataTable
        columns={[
          { key: "name", label: "Name", sortable: true },
          { key: "keyPrefix", label: "Prefix" },
        ]}
        data={[...keys].sort((a, b) => a.name.localeCompare(b.name))}
        keyOf={(k) => k.id}
        caption="API keys"
        emptyTitle="No API keys"
        emptyHint="Create your first key above."
        rowActions={(k) => (
          <IconButton label={`Revoke ${k.name}`} variant="outline" size="sm" onClick={() => setRevoking(k)}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </IconButton>
        )}
      />
      <Modal
        open={revoking != null}
        onClose={() => setRevoking(null)}
        title="Revoke key?"
        description={revoking ? `"${revoking.name}" will stop working immediately.` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevoking(null)}>Cancel</Button>
            <Button variant="danger" onClick={revoke}>Revoke</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>This cannot be undone. Update every integration using this key first.</p>
      </Modal>
    </div>
  );
}
