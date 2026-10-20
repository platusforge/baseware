import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { useI18n } from "@/contexts/i18n-context";
import { Spinner } from "@/components";
import styles from "./guards.module.css";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { signed, loading } = useAuth();
  const { t } = useI18n();
  if (loading)
    return (
      <div className={styles.loading} role="status" aria-live="polite">
        <Spinner label={t("loading")} size="lg" />
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
