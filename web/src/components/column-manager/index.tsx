import { useEffect, useRef, useState } from "react";
import { Button } from "../button";
import styles from "./index.module.css";

export type ColumnManagerItem = { key: string; label: string; visible: boolean };

type Props = {
  items: ColumnManagerItem[];
  onToggle: (key: string, visible: boolean) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onReset?: () => void;
  /** Trigger text. */
  label?: string;
  moveUpLabel?: string;
  moveDownLabel?: string;
  resetLabel?: string;
};

/** Popover to show/hide and reorder table columns. Used by DataTable; usable standalone. */
export function ColumnManager({
  items,
  onToggle,
  onMove,
  onReset,
  label = "Columns",
  moveUpLabel = "Move up",
  moveDownLabel = "Move down",
  resetLabel = "Reset",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      <Button ref={triggerRef} type="button" variant="secondary" size="sm" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg className={styles.triggerIcon} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 3.5h12M2 8h12M2 12.5h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="6" cy="3.5" r="1.6" fill="currentColor" />
          <circle cx="10" cy="8" r="1.6" fill="currentColor" />
          <circle cx="5" cy="12.5" r="1.6" fill="currentColor" />
        </svg>
        {label}
      </Button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label={label}>
          <ul className={styles.list}>
            {items.map((item, index) => (
              <li key={item.key} className={styles.item}>
                <label className={styles.check}>
                  <input type="checkbox" checked={item.visible} onChange={(e) => onToggle(item.key, e.target.checked)} />
                  <span className={styles.itemLabel}>{item.label}</span>
                </label>
                <div className={styles.move}>
                  <button
                    type="button"
                    className={styles.moveBtn}
                    disabled={index === 0}
                    aria-label={`${moveUpLabel}: ${item.label}`}
                    title={moveUpLabel}
                    onClick={() => onMove(item.key, -1)}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12V4m0 0L4 8m4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button
                    type="button"
                    className={styles.moveBtn}
                    disabled={index === items.length - 1}
                    aria-label={`${moveDownLabel}: ${item.label}`}
                    title={moveDownLabel}
                    onClick={() => onMove(item.key, 1)}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4v8m0 0 4-4m-4 4-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {onReset && (
            <button type="button" className={styles.reset} onClick={onReset}>
              {resetLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
