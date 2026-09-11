import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { signed, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!signed) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function PageRoute({ children }: { pageKey?: string; children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.type === "admin") return <>{children}</>;
  return <>{children}</>;
}
