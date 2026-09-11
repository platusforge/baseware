import styles from "./index.module.css";

type Props = {
  tip: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
};

/** CSS-only tooltip. Shows on hover and keyboard focus. Keep tips short — never put essential-only info here. */
export function Tooltip({ tip, position = "top", children }: Props) {
  return (
    <span className={[styles.tip, styles[position]].filter(Boolean).join(" ")} data-tip={tip} tabIndex={0}>
      {children}
    </span>
  );
}
