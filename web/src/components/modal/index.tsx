import { useEffect, useRef } from "react";
import styles from "./index.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, description, size = "md", footer, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    dialogRef.current?.focus();
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={[styles.dialog, styles[size]].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <button type="button" className={styles.close} aria-label="Close dialog" onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
