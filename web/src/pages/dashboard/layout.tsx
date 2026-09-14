import { useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "@/routes";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import { Alert, Avatar, Button, Drawer, IconButton, Select } from "@/components";
import styles from "./layout.module.css";

export default function DashboardLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { organizations, current, setCurrentId } = useOrganization();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = useMemo(
    () => NAV_ITEMS.map((item) => (
      <Link
        key={item.key}
        to={item.path}
        className={loc.pathname === item.path ? "active" : ""}
        onClick={() => setMenuOpen(false)}
      >
        {t(item.labelKey)}
      </Link>
    )),
    [loc.pathname, t],
  );

  async function doLogout() {
    await logout();
    nav("/login");
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <IconButton label="Open menu" onClick={() => setMenuOpen(true)}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 4h16v2H2zM2 9h16v2H2zM2 14h16v2H2z" fill="currentColor" /></svg>
        </IconButton>
        <span className={styles.brand}>{current?.name ?? "Dashboard"}</span>
        <span className={styles.topAvatar}><Avatar name={user?.email ?? "?"} size="sm" /></span>
      </header>

      <aside className="sidebar sidebar--desktop">
        <Select
          label="Organization"
          value={current?.id ?? ""}
          onChange={(e) => setCurrentId(e.target.value)}
          options={organizations.map((o) => ({ value: o.id, label: `${o.name} (${o.plan})` }))}
        />
        <nav className={styles.nav} aria-label="Dashboard">{links}</nav>
        <div className={styles.footer}>
          <span className={styles.user}>
            <Avatar name={user?.email ?? "?"} size="sm" />
            <small className={styles.email}>{user?.email}</small>
          </span>
          <Button variant="ghost" size="sm" onClick={doLogout}>{t("logout")}</Button>
        </div>
      </aside>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={current?.name ?? "Menu"}>
        <div className={styles.drawerBody}>
          <Select
            label="Organization"
            value={current?.id ?? ""}
            onChange={(e) => { setCurrentId(e.target.value); }}
            options={organizations.map((o) => ({ value: o.id, label: `${o.name} (${o.plan})` }))}
          />
          <nav className={styles.drawerNav} aria-label="Dashboard">{links}</nav>
          <Button variant="ghost" onClick={doLogout}>{t("logout")} ({user?.email})</Button>
        </div>
      </Drawer>

      <main className="dashboard__content">
        {user && !user.emailVerifiedAt && (
          <Alert variant="warning" title={t("verifyEmail")}>{t("unverified")}</Alert>
        )}
        {user?.mustChangePassword && (
          <Alert variant="danger">{t("mustChangePassword")}</Alert>
        )}
        <Outlet />
      </main>
    </div>
  );
}
