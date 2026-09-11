import { useRef } from "react";
import styles from "./index.module.css";

export type TabItem = { value: string; label: string; badge?: string | number };

type Props = {
  tabs: TabItem[];
  value: string;
  onChange: (next: string) => void;
  label?: string;
};

export function Tabs({ tabs, value, onChange, label = "Sections" }: Props) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = Math.max(0, tabs.findIndex((t) => t.value === value));

  function onKey(e: React.KeyboardEvent, index: number) {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next != null) {
      e.preventDefault();
      onChange(tabs[next].value);
      btnRefs.current[next]?.focus();
    }
  }

  return (
    <div className={styles.scroller}>
      <div role="tablist" aria-label={label} className={styles.list}>
        {tabs.map((tab, i) => (
          <button
            key={tab.value}
            ref={(el) => { btnRefs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={tab.value === value}
            tabIndex={(i === active ? 0 : -1)}
            className={[styles.tab, tab.value === value ? styles.active : ""].filter(Boolean).join(" ")}
            onClick={() => onChange(tab.value)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {tab.label}
            {tab.badge != null && <span className={styles.badge}>{tab.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
