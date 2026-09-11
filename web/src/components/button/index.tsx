import styles from "./index.module.css";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };

export function Button({ variant = "primary", ...rest }: Props) {
  return <button className={variant === "ghost" ? "btn btn--ghost" : "btn"} {...rest} />;
}
