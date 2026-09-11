import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

export type DropdownItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

type Props = {
  label: string;
  trigger?: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
};

export function Dropdown({ label, trigger, items, align = "right" }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  function onTriggerKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => itemRefs.current[0]?.focus());
    }
  }

  function onItemKey(e: React.KeyboardEvent, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemRefs.current[(index + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(index - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={trigger ? label : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKey}
      >
        {trigger ?? (
          <span className={styles.defaultTrigger}>
            {label}
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </span>
        )}
      </button>
      {open && (
        <ul role="menu" aria-label={label} className={[styles.menu, align === "left" ? styles.left : styles.right].filter(Boolean).join(" ")}>
          {items.map((item, i) => (
            <li key={item.key} role="none">
              <button
                ref={(el) => { itemRefs.current[i] = el; }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={[styles.item, item.danger ? styles.danger : ""].filter(Boolean).join(" ")}
                onKeyDown={(e) => onItemKey(e, i)}
                onClick={() => { setOpen(false); item.onSelect(); }}
              >
                {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
