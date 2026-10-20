import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { detectLang, LANGUAGES, persistLang, translate, type Lang, type MessageKey, type MessageParams } from "@/i18n";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: MessageKey, params?: MessageParams) => string;
  languages: typeof LANGUAGES;
};

const I18nContext = createContext<I18nContextValue>({} as I18nContextValue);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectLang);

  useEffect(() => {
    persistLang(lang);
  }, [lang]);

  const t = useCallback((key: MessageKey, params?: MessageParams) => translate(lang, key, params), [lang]);

  const value = useMemo(
    () => ({ lang, setLang, t, languages: LANGUAGES }),
    [lang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
