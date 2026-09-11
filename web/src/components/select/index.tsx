import { useId } from "react";
import styles from "./index.module.css";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type Props = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export function Select({ label, hint, error, id, options, placeholder, className, ...rest }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      {label && <label className={styles.label} htmlFor={fieldId}>{label}</label>}
      <span className={styles.wrap}>
        <select
          id={fieldId}
          className={[styles.select, error ? styles.invalid : ""].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error) || undefined}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
          ))}
        </select>
        <svg className={styles.chevron} viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {error ? <p className={styles.error} role="alert">{error}</p> : hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
