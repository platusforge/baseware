import { useEffect, useState } from "react";
import styles from "./index.module.css";

export type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; message: string };

let nextId = 0;

function push(kind: ToastKind, message: string) {
  window.dispatchEvent(new CustomEvent<ToastItem>("app-toast", { detail: { id: ++nextId, kind, message } }));
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
};

const ICONS: Record<ToastKind, string> = { success: "✓", error: "✕", info: "ℹ" };

export function Toaster({ duration = 4000 }: { duration?: number }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const item = (e as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev.slice(-3), item]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, duration);
    }
    window.addEventListener("app-toast", onToast);
    return () => window.removeEventListener("app-toast", onToast);
  }, [duration]);

  function dismiss(id: number) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className={styles.region} aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={[styles.toast, styles[t.kind]].filter(Boolean).join(" ")}
        >
          <span className={styles.icon} aria-hidden="true">{ICONS[t.kind]}</span>
          <p className={styles.message}>{t.message}</p>
          <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}
