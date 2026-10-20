import { useEffect, useRef, useState } from "react";
import styles from "./index.module.css";

const EXIT_MS = 160;

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Accessible label for the close button. */
  closeLabel?: string;
};

export function Modal({ open, onClose, title, description, size = "md", footer, children, closeLabel = "Close dialog" }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const [mounted, setMounted] = useState(open);

  // Keep the dialog mounted through the exit animation.
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

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

  if (!mounted) return null;
  const closing = !open;

  return (
    <div className={[styles.overlay, closing ? styles.closing : ""].filter(Boolean).join(" ")} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={[styles.dialog, styles[size], closing ? styles.closing : ""].filter(Boolean).join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{title}</h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
