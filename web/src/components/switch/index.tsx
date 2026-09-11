import styles from "./index.module.css";

type Props = {
  checked: boolean;
  onChecked: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
};

export function Switch({ checked, onChecked, label, disabled, id }: Props) {
  return (
    <span className={styles.wrap}>
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={[styles.track, checked ? styles.on : ""].filter(Boolean).join(" ")}
        onClick={() => onChecked(!checked)}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
      {label && <label htmlFor={id} className={styles.label} onClick={() => !disabled && onChecked(!checked)}>{label}</label>}
    </span>
  );
}
