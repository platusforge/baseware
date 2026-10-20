import { useEffect, useId, useRef, useState } from "react";
import styles from "./index.module.css";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label?: string;
  debounceMs?: number;
};

export function SearchBar({ value, onChange, placeholder = "Search...", label, debounceMs = 0 }: Props) {
  const inputId = useId();
  const [inner, setInner] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => setInner(value), [value]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handle(next: string) {
    setInner(next);
    if (debounceMs > 0) {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => onChange(next), debounceMs);
    } else {
      onChange(next);
    }
  }

  return (
    <div className={styles.wrap} role="search">
      {label && <label className="sr-only" htmlFor={inputId}>{label}</label>}
      <svg className={styles.icon} viewBox="0 0 20 20" aria-hidden="true">
        <path d="M8.5 3a5.5 5.5 0 104.4 8.8l3 3 1.4-1.4-3-3A5.5 5.5 0 008.5 3zm0 2a3.5 3.5 0 110 7 3.5 3.5 0 010-7z" fill="currentColor" />
      </svg>
      <input
        id={inputId}
        className={styles.input}
        type="search"
        value={inner}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        onChange={(e) => handle(e.target.value)}
      />
      {inner && (
        <button type="button" className={styles.clear} aria-label="Clear search" onClick={() => handle("")}>✕</button>
      )}
    </div>
  );
}
