import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "@/routes";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import { Alert, Avatar, Brand, Button, Drawer, IconButton, PageTransition, Select, Sidebar, SidebarNav, type SidebarItem } from "@/components";
import styles from "./layout.module.css";

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <GridIcon />,
  members: <UsersIcon />,
  billing: <CardIcon />,
  "api-keys": <KeyIcon />,
  audit: <ListIcon />,
  settings: <GearIcon />,
  admin: <ShieldIcon />,
};

export default function DashboardLayout() {
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const { organizations, current, setCurrentId } = useOrganization();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore (storage blocked)
    }
  }, [collapsed]);

  const items: SidebarItem[] = useMemo(
    () => NAV_ITEMS.map((item) => ({ key: item.key, label: t(item.labelKey), to: item.path, icon: NAV_ICONS[item.key] })),
    [t],
  );

  const orgSelect = (
    <Select
      label={t("organization")}
      value={current?.id ?? ""}
      onChange={(e) => setCurrentId(e.target.value)}
      options={organizations.map((o) => ({ value: o.id, label: `${o.name} (${o.plan})` }))}
    />
  );

  async function doLogout() {
    await logout();
    nav("/login");
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <IconButton label={t("openMenu")} onClick={() => setMenuOpen(true)}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 4h16v2H2zM2 9h16v2H2zM2 14h16v2H2z" fill="currentColor" /></svg>
        </IconButton>
        <span className={styles.topbarTitle}>{current?.name ?? t("dashboard")}</span>
        <span className={styles.topbarAvatar}>
          <Avatar name={user?.email ?? "?"} size="sm" />
        </span>
      </header>

      <Sidebar
        items={items}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        navLabel={t("dashboard")}
        collapseLabel={t("collapseSidebar")}
        expandLabel={t("expandSidebar")}
        header={
          <>
            <Link to="/dashboard" className={styles.sidebarBrand} aria-label={t("dashboard")}>
              <Brand collapsed={collapsed} />
            </Link>
            <div className={[styles.orgSlot, collapsed ? styles.orgSlotCollapsed : ""].filter(Boolean).join(" ")}>
              {orgSelect}
            </div>
          </>
        }
        footer={
          <>
            <span className={[styles.user, collapsed ? styles.userCollapsed : ""].filter(Boolean).join(" ")}>
              <Avatar name={user?.email ?? "?"} size="sm" />
              <small className={[styles.email, collapsed ? styles.emailHidden : ""].filter(Boolean).join(" ")}>{user?.email}</small>
            </span>
            {collapsed ? (
              <IconButton label={t("logout")} onClick={doLogout} className={[styles.fadeIn, styles.logoutCentered].join(" ")}>
                <LogoutIcon />
              </IconButton>
            ) : (
              <Button variant="ghost" size="sm" onClick={doLogout} className={styles.fadeIn}>
                {t("logout")}
              </Button>
            )}
          </>
        }
      />

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={current?.name ?? t("dashboard")}>
        <div className={styles.drawerBody}>
          {orgSelect}
          <SidebarNav items={items} navLabel={t("dashboard")} />
          <Button variant="ghost" onClick={doLogout}>
            {t("logout")} ({user?.email})
          </Button>
        </div>
      </Drawer>

      <main className={styles.content}>
        {user && !user.emailVerifiedAt && (
          <Alert variant="warning" title={t("verifyEmail")}>
            {t("unverified")}
          </Alert>
        )}
        {user?.mustChangePassword && <Alert variant="danger">{t("mustChangePassword")}</Alert>}
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M15 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 10-10m-4 4 3 3" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.86a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 4.1l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        d="M12.5 6.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v10A1.5 1.5 0 0 0 5 16.5h6a1.5 1.5 0 0 0 1.5-1.5v-1.5M8.5 10h8m0 0-3-3m3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
