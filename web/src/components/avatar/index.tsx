import styles from "./index.module.css";

type Props = {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "busy" | "offline";
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export function Avatar({ name, src, size = "md", status }: Props) {
  return (
    <span className={[styles.avatar, styles[size]].filter(Boolean).join(" ")} role="img" aria-label={name}>
      {src ? <img src={src} alt="" className={styles.img} /> : <span aria-hidden="true">{initials(name) || "?"}</span>}
      {status && <span className={[styles.status, styles[status]].filter(Boolean).join(" ")} aria-hidden="true" />}
    </span>
  );
}
