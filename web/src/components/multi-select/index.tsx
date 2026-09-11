import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "./index.module.css";

export type MultiSelectOption = { value: string; label: string };

type Props = {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  maxBadges?: number;
};

export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled,
  maxBadges = 2,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function toggle(v: string) {
    onChange(selected.has(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  const shown = options.filter((o) => selected.has(o.value)).slice(0, maxBadges);
  const extra = value.length - shown.length;

  return (
    <div className={styles.field} ref={rootRef}>
      {label && <span className={styles.label} id={`${listId}-label`}>{label}</span>}
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${listId}-label` : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={styles.selection}>
          {value.length === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            <>
              {shown.map((o) => (
                <span
                  key={o.value}
                  className={styles.chip}
                  onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggle(o.value); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${o.label}`}
                >
                  {o.label} ✕
                </span>
              ))}
              {extra > 0 && <span className={styles.more}>+{extra}</span>}
            </>
          )}
        </span>
        <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className={styles.panel}>
          <input
            className={styles.search}
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={searchPlaceholder}
          />
          <ul className={styles.list} role="listbox" aria-multiselectable="true" id={listId}>
            {filtered.length === 0 && <li className={styles.noresults}>No matches</li>}
            {filtered.map((o) => (
              <li key={o.value} role="option" aria-selected={selected.has(o.value)}>
                <label className={styles.item}>
                  <input type="checkbox" checked={selected.has(o.value)} onChange={() => toggle(o.value)} />
                  <span>{o.label}</span>
                </label>
              </li>
            ))}
          </ul>
          {value.length > 0 && (
            <button type="button" className={styles.clear} onClick={() => onChange([])}>Clear all</button>
          )}
        </div>
      )}
    </div>
  );
}
