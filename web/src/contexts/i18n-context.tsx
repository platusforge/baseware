import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { STRINGS, type Lang } from "@/i18n/strings";

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string }>({} as never);

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
