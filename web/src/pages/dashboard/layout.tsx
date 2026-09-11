import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "@/routes";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization } from "@/contexts/organization-context";

export default function DashboardLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, logout } = useAuth();
  const { organizations, current, setCurrentId } = useOrganization();

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <select value={current?.id ?? ""} onChange={(e) => setCurrentId(e.target.value)} className="input">
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.plan})</option>)}
        </select>
        <nav style={{ marginTop: 12 }}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} to={item.path} className={loc.pathname === item.path ? "active" : ""}>{item.label}</Link>
          ))}
        </nav>
        <div style={{ marginTop: 20 }}>
          <small>{user?.email}</small>
          <br />
          <button className="btn btn--ghost" onClick={async () => { await logout(); nav("/login"); }}>Logout</button>
        </div>
      </aside>
      <main className="dashboard__content">
        <Outlet />
      </main>
    </div>
  );
}
