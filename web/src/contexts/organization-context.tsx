import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "./auth-context";
import type { IOrganization } from "@/types/models";

type OrgContextData = {
  organizations: IOrganization[];
  current: IOrganization | null;
  setCurrentId: (id: string) => void;
  reload: () => Promise<void>;
};

const OrganizationContext = createContext<OrgContextData>({} as OrgContextData);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { signed } = useAuth();
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(() => localStorage.getItem("orgId"));

  const reload = useCallback(async () => {
    if (!signed) return;
    const list = await api.get<IOrganization[]>("/organizations").catch(() => []);
    setOrganizations(list);
    if (list.length > 0 && !list.some((o) => o.id === currentId)) setCurrentId(list[0].id);
  }, [signed, currentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (currentId) localStorage.setItem("orgId", currentId);
  }, [currentId]);

  const value = useMemo(
    () => ({
      organizations,
      current: organizations.find((o) => o.id === currentId) ?? organizations[0] ?? null,
      setCurrentId,
      reload,
    }),
    [organizations, currentId, reload],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
