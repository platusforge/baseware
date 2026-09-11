import { Link, useParams } from "react-router-dom";
import { useI18n } from "@/contexts/i18n-context";
import { useSeo } from "@/utils/seo";
import { POSTS } from "./posts";

export default function BlogPostPage() {
  const { slug } = useParams();
  const { lang } = useI18n();
  const post = POSTS.find((p) => p.slug === slug);
  const content = post ? (lang === "pt-BR" ? post.pt : post.en) : null;
  useSeo(
    content ? `${content.title} — SaaS Boilerplate` : "Not found — SaaS Boilerplate",
    content?.excerpt ?? "Post not found.",
  );

  if (!post || !content) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <p><Link to="/blog">← Blog</Link></p>
        <h1>Not found</h1>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 720 }}>
      <p><Link to="/blog">← Blog</Link></p>
      <small>{post.date}</small>
      <h1>{content.title}</h1>
      {content.body.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
