import { Link, useParams } from "react-router-dom";
import { EmptyState, SiteLayout } from "@/components";
import { useI18n } from "@/contexts/i18n-context";
import { useSeo } from "@/utils/seo";
import { formatDate } from "@/utils/dates";
import { POSTS } from "./posts";
import styles from "./post.module.css";

export default function BlogPostPage() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const post = POSTS.find((p) => p.slug === slug);
  const content = post ? (lang === "pt-BR" ? post.pt : post.en) : null;
  useSeo(
    content ? `${content.title} — DevKit` : `${t("notFound")} — DevKit`,
    content?.excerpt ?? t("postNotFound"),
  );

  if (!post || !content) {
    return (
      <SiteLayout>
        <EmptyState
          title={t("notFound")}
          description={t("postNotFound")}
          action={
            <Link to="/blog" className={styles.backAction}>
              {t("backToBlog")}
            </Link>
          }
        />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <article className={styles.post}>
        <Link to="/blog" className={styles.back}>
          ← {t("backToBlog")}
        </Link>
        <time dateTime={post.date} className={styles.date}>
          {formatDate(post.date, lang)}
        </time>
        <h1 className={styles.title}>{content.title}</h1>
        {content.body.map((paragraph, i) => (
          <p key={i} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </article>
    </SiteLayout>
  );
}
