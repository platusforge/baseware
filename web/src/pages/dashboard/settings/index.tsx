import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Alert, Button, Input, Modal, PageHeader } from "@/components";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

export default function SettingsPage() {
  const nav = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { current, reload } = useOrganization();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteOrg, setConfirmDeleteOrg] = useState(false);
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUrl, setMfaUrl] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [sessions, setSessions] = useState<{ id: string; createdAt: string; expiresAt: string; revokedAt: string | null }[]>([]);

  async function createOrg() {
    if (!name.trim()) return;
    await api.post("/organizations", { name: name.trim() });
    setName("");
    reload();
  }

  async function resendVerification() {
    const result = await api.post<{ message: string }>("/auth/verify/request", {});
    setMessage(result.message);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await api.post<{ message: string }>("/auth/password", { currentPassword, newPassword });
      setMessage(result.message);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  async function deleteOrg() {
    if (!current) return;
    await api.del(`/organizations/${current.id}`);
    setConfirmDeleteOrg(false);
    reload();
    nav("/dashboard");
  }

  async function deleteAccountWithPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.del<{ message: string }>("/auth/account", deletePassword ? { password: deletePassword } : {});
      await logout();
      nav("/login");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error");
    }
  }

  async function loadSessions() {
    try {
      setSessions(await api.get<typeof sessions>("/auth/sessions"));
    } catch {
      setSessions([]);
    }
  }

  async function setupMfa() {
    const r = await api.post<{ secret: string; otpauthUrl: string }>("/auth/mfa/setup", {});
    setMfaSecret(r.secret);
    setMfaUrl(r.otpauthUrl);
  }

  async function confirmMfa() {
    const r = await api.post<{ backupCodes: string[] }>("/auth/mfa/confirm", { code: mfaCode });
    setBackupCodes(r.backupCodes);
    setMfaSecret("");
    setMfaUrl("");
    setMfaCode("");
    refreshUser();
  }

  async function disableMfa() {
    await api.post("/auth/mfa/disable", { code: mfaCode });
    setMfaCode("");
    refreshUser();
    setMessage(t("mfaDisabledMsg"));
  }

  async function exportData() {
    const data = await api.get<unknown>("/auth/privacy/export");
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title={t("settings")} subtitle={current?.name} />
      {message && (
        <Alert variant="info" role="status">
          {message}
        </Alert>
      )}

      <div className={`card ${styles.card}`}>
        <h3>{t("profile")}</h3>
        <p>
          {user?.email} {user?.emailVerifiedAt ? `(${t("verified")})` : `(${t("unverifiedLabel")})`}
        </p>
        {!user?.emailVerifiedAt && (
          <Button variant="ghost" onClick={resendVerification}>
            {t("resendVerification")}
          </Button>
        )}
      </div>

      <div className={`card ${styles.card}`}>
        <h3>{t("newOrg")}</h3>
        <div className={styles.row}>
          <Input label={t("orgName")} value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={createOrg}>{t("create")}</Button>
        </div>
      </div>

      <div className={`card ${styles.card}`}>
        <h3>{t("changePassword")}</h3>
        {user?.mustChangePassword && (
          <Alert variant="danger" role="alert">
            {t("mustChangePassword")}
          </Alert>
        )}
        <form onSubmit={changePassword} className={styles.form}>
          <Input
            label={t("currentPassword")}
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit">{t("updatePassword")}</Button>
        </form>
      </div>

      <div className={`card ${styles.card}`}>
        <h3>{t("mfa")}</h3>
        <p>
          {t("mfaStatus")}: {user?.mfaEnabled ? t("enabled") : t("disabled")}
        </p>
        {!user?.mfaEnabled && !mfaSecret && (
          <Button type="button" variant="ghost" onClick={setupMfa}>
            {t("startMfa")}
          </Button>
        )}
        {mfaSecret && (
          <div className={styles.form}>
            <p>Scan in your authenticator or enter manually:</p>
            <code style={{ overflowWrap: "anywhere" }}>{mfaSecret}</code>
            <p style={{ overflowWrap: "anywhere" }}>
              <small>{mfaUrl}</small>
            </p>
            <Input label="6-digit code" inputMode="numeric" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
            <Button type="button" onClick={confirmMfa}>
              {t("confirmEnable")}
            </Button>
          </div>
        )}
        {backupCodes.length > 0 && (
          <div>
            <p>Backup codes (save once):</p>
            <ul>
              {backupCodes.map((c) => (
                <li key={c}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
        {user?.mfaEnabled && (
          <div className={styles.row}>
            <Input label="code or backup code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
            <Button type="button" variant="ghost" onClick={disableMfa}>
              {t("disableMfa")}
            </Button>
          </div>
        )}
      </div>

      <div className={`card ${styles.card}`}>
        <h3>{t("sessions")}</h3>
        <Button type="button" variant="ghost" onClick={loadSessions}>
          {t("loadSessions")}
        </Button>
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              {new Date(s.createdAt).toLocaleString()} · {s.revokedAt ? "revoked" : "active"}{" "}
              <Button type="button" variant="ghost" size="sm" onClick={() => api.del(`/auth/sessions/${s.id}`).then(loadSessions)}>
                {t("revoke")}
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className={`card ${styles.card}`}>
        <h3>Privacy</h3>
        <Button type="button" variant="ghost" onClick={exportData}>
          {t("exportData")} (JSON)
        </Button>
      </div>

      <div className={`card ${styles.card}`}>
        <h3>{t("dangerZone")}</h3>
        <div className={styles.form}>
          <div>
            <Button variant="ghost" onClick={() => setConfirmDeleteOrg(true)}>
              {t("deleteOrg")} {current?.name ?? ""}
            </Button>
          </div>
          {!confirmDelete ? (
            <div>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
                {t("deleteAccount")}
              </Button>
            </div>
          ) : (
            <form onSubmit={deleteAccountWithPassword} className={styles.form}>
              <p>This is permanent. Confirm with your password (OAuth-only accounts: leave empty and press delete).</p>
              <Input
                label={t("password")}
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
              <div className={styles.row}>
                <Button type="submit">{t("deletePermanent")}</Button>
                <Button variant="ghost" type="button" onClick={() => setConfirmDelete(false)}>
                  {t("cancel")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <Modal
        open={confirmDeleteOrg}
        onClose={() => setConfirmDeleteOrg(false)}
        title={`${t("deleteOrg")}?`}
        description={current ? `"${current.name}"` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDeleteOrg(false)}>
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={deleteOrg}>
              {t("deletePermanent")}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>This cannot be undone. The organization will be deactivated.</p>
      </Modal>
    </div>
  );
}
