import { useId, useState } from "react";
import styles from "./index.module.css";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  /** Accessible labels for the password visibility toggle (i18n owned by the page). */
  revealLabel?: string;
  hideLabel?: string;
};

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
      {off && <path d="M4 20 20 4" />}
    </svg>
  );
}

export function Input({
  label,
  hint,
  error,
  id,
  className,
  revealLabel = "Show password",
  hideLabel = "Hide password",
  ...rest
}: Props) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [revealed, setRevealed] = useState(false);
  const isPassword = rest.type === "password";
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={[styles.field, className ?? ""].filter(Boolean).join(" ")}>
      {label && <label className={styles.label} htmlFor={fieldId}>{label}</label>}
      <div className={styles.control}>
        <input
          {...rest}
          id={fieldId}
          type={isPassword && revealed ? "text" : rest.type}
          className={[styles.input, isPassword ? styles.hasToggle : "", error ? styles.invalid : ""].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.toggle}
            aria-label={revealed ? hideLabel : revealLabel}
            aria-pressed={revealed}
            onClick={() => setRevealed((v) => !v)}
          >
            <EyeIcon off={revealed} />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className={styles.error} role="alert">{error}</p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className={styles.hint}>{hint}</p>
      ) : null}
    </div>
  );
}
