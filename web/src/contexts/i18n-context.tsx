import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "en" | "pt-BR";
const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }>({} as never);

const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    hero: "Ship your SaaS faster",
    cta: "Start free",
    pricing: "Pricing",
    login: "Login",
    dashboard: "Dashboard",
  },
  "pt-BR": {
    hero: "Lance seu SaaS mais rápido",
    cta: "Começar grátis",
    pricing: "Preços",
    login: "Entrar",
    dashboard: "Painel",
  },
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("lang") as Lang) ?? "en");
  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(
    () => ({ lang, setLang, t: (key: string) => STRINGS[lang][key] ?? key }),
    [lang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
