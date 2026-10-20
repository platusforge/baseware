import { localeOf, type Lang } from "@/i18n";

export function formatNumber(value: number, lang: Lang, opts?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(localeOf(lang), opts);
}

export function formatCurrency(value: number, currency: string, lang: Lang): string {
  return new Intl.NumberFormat(localeOf(lang), {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}
