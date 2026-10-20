import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import styles from "./index.module.css";

type Props = {
  /** Content max-width: sm=560px (auth-like), md=760px (docs/blog), lg=1080px (landing pages). */
  width?: "sm" | "md" | "lg";
  children: React.ReactNode;
};

/** Public page chrome: site header + centered content + site footer. */
export function SiteLayout({ width = "md", children }: Props) {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <div className={[styles.content, styles[width]].filter(Boolean).join(" ")}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
