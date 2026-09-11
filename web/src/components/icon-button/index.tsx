import styles from "./index.module.css";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "primary";
};

export function IconButton({ label, size = "md", variant = "ghost", className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[styles.iconbtn, styles[size], styles[variant], className ?? ""].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
