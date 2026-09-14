import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Spinner } from "@/components";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { signed, loading } = useAuth();
  if (loading)
    return (
      <div role="status" aria-live="polite" style={{ padding: 24 }}>
        <Spinner label="Loading..." />
      </div>
    );
  if (!signed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * UX-only authorization gate. The backend (requirePage/requireOrgRole)
 * always re-enforces — this just hides pages the user can't open.
 */
export function PageRoute({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const permissions = user?.permissions;
  if (user?.type === "admin") return <>{children}</>;
  if (!permissions) return <>{children}</>;
  if (permissions.configured === false) return <Navigate to="/dashboard" replace />;
  if (permissions.allowedPages.length > 0 && !permissions.allowedPages.includes(pageKey)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
