import { useId } from "react";
import styles from "./index.module.css";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Textarea({ label, hint, error, id, className, rows = 4, ...rest }: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      {label && <label className={styles.label} htmlFor={fieldId}>{label}</label>}
      <textarea
        id={fieldId}
        rows={rows}
        className={[styles.area, error ? styles.invalid : ""].filter(Boolean).join(" ")}
        aria-invalid={Boolean(error) || undefined}
        {...rest}
      />
      {error ? <p className={styles.error} role="alert">{error}</p> : hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
