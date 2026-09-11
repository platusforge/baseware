import { useId } from "react";
import styles from "./index.module.css";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: React.ReactNode;
  hint?: string;
};

export function Checkbox({ label, hint, id, className, ...rest }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={[styles.wrap, className ?? ""].filter(Boolean).join(" ")}>
      <input id={fieldId} type="checkbox" className={styles.box} {...rest} />
      <span className={styles.check} aria-hidden="true">
        <svg viewBox="0 0 12 12"><path d="M2 6.5l2.5 2.5L10 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </span>
      <span className={styles.text}>
        <label htmlFor={fieldId} className={styles.label}>{label}</label>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
    </div>
  );
}
