import { en } from "./messages/en";
import { ptBR } from "./messages/pt-br";

export type Lang = "en" | "pt-BR";

export type MessageParams = Record<string, string | number>;

export type PluralMessage = {
  one: string;
  other: string;
  [form: string]: string;
};

export type MessageValue = string | PluralMessage;

/** Every translation key (source of truth: the English catalog). */
export type MessageKey = keyof typeof en;

export type TFunction = (key: MessageKey, params?: MessageParams) => string;

export const DEFAULT_LANG: Lang = "en";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN", locale: "en-US" },
  { code: "pt-BR", label: "Português (Brasil)", short: "PT", locale: "pt-BR" },
] as const;

export type LanguageOption = (typeof LANGUAGES)[number];

// Compile-time guarantees: every English key is required in pt-BR.
const enCatalog: Record<MessageKey, MessageValue> = en;
const ptCatalog: Record<MessageKey, MessageValue> = ptBR;
export const MESSAGES: Record<Lang, Record<MessageKey, MessageValue>> = {
  en: enCatalog,
  "pt-BR": ptCatalog,
};

export const LANG_STORAGE_KEY = "lang";

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "pt-BR";
}

/** Stored preference wins; the first visit follows the browser language. */
export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // ignore (storage blocked)
  }
  if (typeof navigator !== "undefined") {
    const candidates = [navigator.language, ...(navigator.languages ?? [])];
    for (const candidate of candidates) {
      if (candidate && candidate.toLowerCase().startsWith("pt")) return "pt-BR";
    }
  }
  return DEFAULT_LANG;
}

export function persistLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore (storage blocked)
  }
  document.documentElement.lang = lang;
}

export function localeOf(lang: Lang): string {
  return LANGUAGES.find((l) => l.code === lang)?.locale ?? "en-US";
}

export function nextLang(lang: Lang): Lang {
  const index = LANGUAGES.findIndex((l) => l.code === lang);
  return LANGUAGES[(index + 1) % LANGUAGES.length].code;
}

/** Replaces {{name}} tokens. Unknown tokens are kept as-is for easier debugging. */
export function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

function resolveValue(lang: Lang, value: MessageValue, params?: MessageParams): string {
  if (typeof value === "string") return value;
  const count = Number(params?.count ?? 0);
  const form = new Intl.PluralRules(localeOf(lang)).select(count);
  return value[form] ?? value.other;
}

/**
 * Translates a key with interpolation (`{{name}}`) and plural forms
 * (`{ one, other }`, driven by `params.count` via Intl.PluralRules).
 */
export function translate(lang: Lang, key: MessageKey, params?: MessageParams): string {
  const value = MESSAGES[lang]?.[key] ?? MESSAGES.en[key];
  if (value === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key "${String(key)}" (${lang})`);
    return String(key);
  }
  return interpolate(resolveValue(lang, value, params), params);
}
