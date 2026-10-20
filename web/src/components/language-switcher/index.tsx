import { useI18n } from "@/contexts/i18n-context";
import { nextLang, type Lang } from "@/i18n";
import styles from "./index.module.css";

type Props = {
  /** "menu": native select with full language names. "toggle": cycles to the next language. */
  variant?: "menu" | "toggle";
  /** Toggle only: render just the globe icon (icon rails / compact topbars). */
  iconOnly?: boolean;
  className?: string;
};

function GlobeIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c2.2 2 3.4 4.7 3.4 7.5S12.2 15.5 10 17.5C7.8 15.5 6.6 12.8 6.6 10S7.8 4.5 10 2.5Z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Language selector — menu (native select) or a compact cycling toggle. */
export function LanguageSwitcher({ variant = "menu", iconOnly = false, className }: Props) {
  const { lang, setLang, t, languages } = useI18n();

  if (variant === "toggle") {
    const next = nextLang(lang);
    const nextOption = languages.find((option) => option.code === next);
    const label = t("switchToLanguage", { language: nextOption?.label ?? next });
    return (
      <button
        type="button"
        className={[styles.toggle, className ?? ""].filter(Boolean).join(" ")}
        onClick={() => setLang(next)}
        aria-label={label}
        title={label}
      >
        <GlobeIcon />
        {!iconOnly && <span className={styles.short}>{nextOption?.short ?? next}</span>}
      </button>
    );
  }

  return (
    <div className={[styles.menu, className ?? ""].filter(Boolean).join(" ")}>
      <GlobeIcon />
      <select
        className={styles.select}
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t("language")}
        title={t("language")}
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronIcon />
    </div>
  );
}
