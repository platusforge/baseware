import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/i18n-context";
import { useSeo } from "@/utils/seo";
import { POSTS } from "./posts";

export default function BlogPage() {
  const { lang } = useI18n();
  useSeo("Blog — SaaS Boilerplate", "Notes on multi-tenant billing, auth sessions and shipping with AI.");
  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <p><Link to="/">← Home</Link></p>
      <h1>Blog</h1>
      <div style={{ display: "grid", gap: 16 }}>
        {POSTS.map((post) => {
          const content = lang === "pt-BR" ? post.pt : post.en;
          return (
            <article key={post.slug} className="card">
              <small>{post.date}</small>
              <h2 style={{ margin: "4px 0" }}><Link to={`/blog/${post.slug}`}>{content.title}</Link></h2>
              <p>{content.excerpt}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
