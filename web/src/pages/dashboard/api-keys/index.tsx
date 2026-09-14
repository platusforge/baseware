import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { Alert, Button, DataTable, IconButton, Input, Modal, PageHeader, toast } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import { useOrganization } from "@/contexts/organization-context";
import styles from "./index.module.css";

type ApiKey = { id: string; name: string; keyPrefix: string };

const ALL_SCOPES = ["members:read", "audit:read", "usage:write", "billing:read"];

export default function ApiKeysPage() {
  const { t } = useI18n();
  const { current } = useOrganization();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["members:read"]);
  const [created, setCreated] = useState("");
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      setKeys(await api.get<ApiKey[]>("/api-keys").catch(() => []));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);

  function toggleScope(s: string) {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function create() {
    if (!name.trim()) return;
    try {
      const r = await api.post<{ apiKey: string }>("/api-keys", {
        name: name.trim(),
        organizationId: current?.id,
        scopes,
      });
      setCreated(r.apiKey);
      setName("");
      reload();
    } catch {
      toast.error(t("createFailed"));
    }
  }

  async function revoke() {
    if (!revoking) return;
    try {
      await api.del(`/api-keys/${revoking.id}`);
      toast.success(t("keyRevoked"));
      setRevoking(null);
      reload();
    } catch {
      toast.error(t("revokeFailed"));
    }
  }

  return (
    <div>
      <PageHeader title={t("apiKeys")} subtitle={t("copyOnce")} />
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <Input label={t("newKeyName")} placeholder="ci-deploy" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit">{t("create")}</Button>
      </form>
      <fieldset style={{ marginBottom: 16 }}>
        <legend>Scopes</legend>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {ALL_SCOPES.map((s) => (
            <label key={s} style={{ display: "flex", gap: 6, alignItems: "center", minHeight: 44 }}>
              <input type="checkbox" checked={scopes.includes(s)} onChange={() => toggleScope(s)} />
              <code>{s}</code>
            </label>
          ))}
        </div>
      </fieldset>
      {created && (
        <div className={styles.secret}>
          <Alert variant="success" title={t("keyCreated")} onDismiss={() => setCreated("")}>
            <code>{created}</code>
          </Alert>
        </div>
      )}
      <DataTable
        columns={[
          { key: "name", label: t("name"), sortable: true },
          { key: "keyPrefix", label: "Prefix" },
        ]}
        data={[...keys].sort((a, b) => a.name.localeCompare(b.name))}
        keyOf={(k) => k.id}
        loading={loading}
        caption="API keys"
        emptyTitle={t("noApiKeys")}
        emptyHint={t("createFirstKey")}
        rowActions={(k) => (
          <IconButton label={`${t("revoke")} ${k.name}`} variant="outline" size="md" onClick={() => setRevoking(k)}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
        )}
      />
      <Modal
        open={revoking != null}
        onClose={() => setRevoking(null)}
        title={t("revokeTitle")}
        description={revoking ? `"${revoking.name}" ${t("revokeDesc")}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevoking(null)}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={revoke}>
              {t("revoke")}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>{t("revokeWarn")}</p>
      </Modal>
    </div>
  );
}
