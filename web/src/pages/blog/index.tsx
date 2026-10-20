import { Link } from "react-router-dom";
import { SiteLayout } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import { useSeo } from "@/utils/seo";
import { formatDate } from "@/utils/dates";
import { POSTS } from "./posts";
import styles from "./index.module.css";

export default function BlogPage() {
  const { t, lang } = useI18n();
  useSeo("Blog — SaaS Boilerplate", t("blogSubtitle"));

  return (
    <SiteLayout>
      <header className={styles.head}>
        <h1>Blog</h1>
        <p>{t("blogSubtitle")}</p>
      </header>
      <div className={styles.list}>
        {POSTS.map((post) => {
          const content = lang === "pt-BR" ? post.pt : post.en;
          return (
            <article key={post.slug} className={styles.card}>
              <time dateTime={post.date} className={styles.date}>
                {formatDate(post.date, lang)}
              </time>
              <h2 className={styles.title}>
                <Link to={`/blog/${post.slug}`}>{content.title}</Link>
              </h2>
              <p className={styles.excerpt}>{content.excerpt}</p>
              <span className={styles.more} aria-hidden="true">
                {t("readMore")} →
              </span>
            </article>
          );
        })}
      </div>
    </SiteLayout>
  );
}
