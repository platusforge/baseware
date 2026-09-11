import { useEffect, useRef } from "react";
import styles from "./index.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: "left" | "right";
  children: React.ReactNode;
};

export function Drawer({ open, onClose, title, side = "left", children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    panelRef.current?.focus();
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      (prevFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Panel"}
        tabIndex={-1}
        className={[styles.panel, side === "right" ? styles.right : styles.left].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          <button type="button" className={styles.close} aria-label="Close panel" onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
