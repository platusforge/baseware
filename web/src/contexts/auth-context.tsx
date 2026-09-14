import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { IUser } from "@/types/models";

type AuthContextData = {
  user: IUser | null;
  signed: boolean;
  loading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<{ mustChangePassword?: boolean; emailVerified?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get<IUser>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
    const onUnauthorized = () => {
      setUser(null);
      if (!window.location.pathname.startsWith("/login")) window.location.href = "/login";
    };
    window.addEventListener("unauthorized", onUnauthorized);
    return () => window.removeEventListener("unauthorized", onUnauthorized);
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    const result = await api.post<{ mustChangePassword?: boolean; emailVerified?: boolean }>("/auth/login", { email, password, mfaCode });
    await refreshUser();
    return result;
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, signed: !!user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
