import type { Lang } from "@/i18n/strings";

function toDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  // Date-only strings ("2026-09-01") are parsed as UTC; anchor them to local time.
  return new Date(input.length === 10 ? `${input}T00:00:00` : input);
}

function localeOf(lang: Lang): string {
  return lang === "pt-BR" ? "pt-BR" : "en-US";
}

export function formatDate(input: string | Date, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  return toDate(input).toLocaleDateString(localeOf(lang), opts ?? { year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(input: string | Date, lang: Lang): string {
  return toDate(input).toLocaleString(localeOf(lang), { dateStyle: "medium", timeStyle: "short" });
}
