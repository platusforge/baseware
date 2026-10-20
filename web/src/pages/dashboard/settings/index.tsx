import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { Alert, Badge, Button, Card, Input, Modal, PageHeader } from "@/components";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import { translateApiError } from "@/utils/api-errors";
import { formatDateTime } from "@/utils/dates";
import styles from "./index.module.css";

export default function SettingsPage() {
  const nav = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { current, reload } = useOrganization();
  const { t, lang } = useI18n();
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
    try {
      await api.post("/organizations", { name: name.trim() });
      setName("");
      reload();
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function resendVerification() {
    try {
      await api.post("/auth/verify/request", {});
      setMessage(t("verificationSent"));
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post<{ message: string }>("/auth/password", { currentPassword, newPassword });
      setMessage(t("passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function deleteOrg() {
    if (!current) return;
    try {
      await api.del(`/organizations/${current.id}`);
      setConfirmDeleteOrg(false);
      reload();
      nav("/dashboard");
    } catch (err) {
      setConfirmDeleteOrg(false);
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function deleteAccountWithPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.del<{ message: string }>("/auth/account", deletePassword ? { password: deletePassword } : {});
      await logout();
      nav("/login");
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
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
    try {
      const r = await api.post<{ secret: string; otpauthUrl: string }>("/auth/mfa/setup", {});
      setMfaSecret(r.secret);
      setMfaUrl(r.otpauthUrl);
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function confirmMfa() {
    try {
      const r = await api.post<{ backupCodes: string[] }>("/auth/mfa/confirm", { code: mfaCode });
      setBackupCodes(r.backupCodes);
      setMfaSecret("");
      setMfaUrl("");
      setMfaCode("");
      refreshUser();
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function disableMfa() {
    try {
      await api.post("/auth/mfa/disable", { code: mfaCode });
      setMfaCode("");
      refreshUser();
      setMessage(t("mfaDisabledMsg"));
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  async function exportData() {
    try {
      const data = await api.get<unknown>("/auth/privacy/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(translateApiError(err instanceof Error ? err.message : "", t));
    }
  }

  return (
    <div>
      <PageHeader title={t("settings")} subtitle={current?.name} />
      {message && (
        <Alert variant="info" role="status">
          {message}
        </Alert>
      )}

      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>{t("profile")}</h2>
        <p className={styles.value}>
          {user?.email}{" "}
          <Badge variant={user?.emailVerifiedAt ? "success" : "warning"}>
            {user?.emailVerifiedAt ? t("verified") : t("unverifiedLabel")}
          </Badge>
        </p>
        {!user?.emailVerifiedAt && (
          <div className={styles.actions}>
            <Button variant="secondary" onClick={resendVerification}>
              <MailIcon />
              {t("resendVerification")}
            </Button>
          </div>
        )}
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>{t("newOrg")}</h2>
        <div className={styles.row}>
          <Input label={t("orgName")} value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={createOrg}>{t("create")}</Button>
        </div>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>{t("changePassword")}</h2>
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
            revealLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
          <Input
            label={t("newPassword")}
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            revealLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
          <Button type="submit">{t("updatePassword")}</Button>
        </form>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>{t("mfa")}</h2>
        <p className={styles.value}>
          {t("mfaStatus")}:{" "}
          <Badge variant={user?.mfaEnabled ? "success" : "default"}>{user?.mfaEnabled ? t("enabled") : t("disabled")}</Badge>
        </p>
        {!user?.mfaEnabled && !mfaSecret && (
          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={setupMfa}>
              <ShieldIcon />
              {t("startMfa")}
            </Button>
          </div>
        )}
        {mfaSecret && (
          <div className={styles.form}>
            <p className={styles.value}>{t("mfaScan")}</p>
            <code className={styles.code}>{mfaSecret}</code>
            <p className={styles.break}>
              <small>{mfaUrl}</small>
            </p>
            <Input label={t("mfaCodeLabel")} inputMode="numeric" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
            <Button type="button" onClick={confirmMfa}>
              {t("confirmEnable")}
            </Button>
          </div>
        )}
        {backupCodes.length > 0 && (
          <div>
            <p className={styles.value}>{t("backupCodesTitle")}</p>
            <ul className={styles.codes}>
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
            <Input label={t("backupCodeLabel")} value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
            <Button type="button" variant="danger-outline" onClick={disableMfa}>
              {t("disableMfa")}
            </Button>
          </div>
        )}
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>{t("sessions")}</h2>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={loadSessions}>
            <RefreshIcon />
            {t("loadSessions")}
          </Button>
        </div>
        <ul className={styles.sessions}>
          {sessions.map((s) => (
            <li key={s.id} className={styles.session}>
              <span className={styles.value}>
                {formatDateTime(s.createdAt, lang)}{" "}
                <Badge variant={s.revokedAt ? "danger" : "success"}>{s.revokedAt ? t("revoked") : t("active")}</Badge>
              </span>
              <Button
                type="button"
                variant="danger-outline"
                size="sm"
                onClick={() => api.del(`/auth/sessions/${s.id}`).then(loadSessions)}
              >
                {t("revoke")}
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className={styles.card}>
        <h2 className={styles.cardTitle}>{t("privacy")}</h2>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={exportData}>
            <DownloadIcon />
            {t("exportData")} (JSON)
          </Button>
        </div>
      </Card>

      <Card className={`${styles.card} ${styles.dangerCard}`}>
        <h2 className={styles.cardTitle}>{t("dangerZone")}</h2>
        <div className={styles.actions}>
          <Button variant="danger-outline" onClick={() => setConfirmDeleteOrg(true)}>
            <TrashIcon />
            {t("deleteOrg")} {current?.name ?? ""}
          </Button>
          {!confirmDelete && (
            <Button variant="danger-outline" onClick={() => setConfirmDelete(true)}>
              <TrashIcon />
              {t("deleteAccount")}
            </Button>
          )}
        </div>
        {confirmDelete && (
          <form onSubmit={deleteAccountWithPassword} className={styles.form}>
            <p className={styles.value}>{t("deleteAccountWarning")}</p>
            <Input
              label={t("password")}
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              revealLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
            <div className={styles.row}>
              <Button type="submit" variant="danger">
                {t("deletePermanent")}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setConfirmDelete(false)}>
                {t("cancel")}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Modal
        open={confirmDeleteOrg}
        onClose={() => setConfirmDeleteOrg(false)}
        title={`${t("deleteOrg")}?`}
        description={current ? `"${current.name}"` : undefined}
        size="sm"
        closeLabel={t("close")}
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
        <p className={styles.value}>{t("deleteOrgWarning")}</p>
      </Modal>
    </div>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m2 4.5 6 4.5 6-4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M8 1.5 13.5 3.5v4c0 3.5-5.5 7-5.5 7s-5.5-3.5-5.5-7v-4L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="m5.8 8 1.6 1.6L10.5 6.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V5H11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M8 2v8m0 0 3-3M8 10 5 7M3 13.5h10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M2.5 4h11M6 4V2.5h4V4m-6 0 .6 9.5h6.8L12 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
