import { useId } from "react";
import styles from "./index.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, id, className, ...rest }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      {label && <label className={styles.label} htmlFor={fieldId}>{label}</label>}
      <input
        id={fieldId}
        className={[styles.input, error ? styles.invalid : ""].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {error ? (
        <p id={`${fieldId}-error`} className={styles.error} role="alert">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}
