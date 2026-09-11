import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader } from "@/components";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";

export default function SettingsPage() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { current, reload } = useOrganization();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function createOrg() {
    await api.post("/organizations", { name });
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
    if (!window.confirm(`Delete ${current.name} permanently?`)) return;
    await api.del(`/organizations/${current.id}`);
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

  return (
    <div>
      <PageHeader title="Settings" subtitle={current?.name} />
      {message && <p>{message}</p>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Profile</h3>
        <p>{user?.email} {user?.emailVerifiedAt ? "(verified)" : "(unverified)"}</p>
        {!user?.emailVerifiedAt && (
          <button className="btn btn--ghost" onClick={resendVerification}>Resend verification email</button>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>New organization</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="input" placeholder="org name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn" onClick={createOrg}>Create</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Change password</h3>
        <form onSubmit={changePassword} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
          <input className="input" type="password" autoComplete="current-password" placeholder="current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <input className="input" type="password" autoComplete="new-password" placeholder="new password (min 12)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button className="btn" type="submit">Update password</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Danger zone</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <button className="btn btn--ghost" onClick={deleteOrg}>Delete {current?.name ?? "organization"}</button>
          </div>
          {!confirmDelete ? (
            <div>
              <button className="btn btn--ghost" onClick={() => setConfirmDelete(true)}>Delete my account…</button>
            </div>
          ) : (
            <form onSubmit={deleteAccountWithPassword} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
              <p>This is permanent. Confirm with your password (OAuth-only accounts: leave empty and press delete).</p>
              <input className="input" type="password" autoComplete="current-password" placeholder="password (if set)" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" type="submit">Delete permanently</button>
                <button className="btn btn--ghost" type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
