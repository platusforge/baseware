import { Link } from "react-router-dom";
import { useI18n } from "@/contexts/i18n-context";
import { PricingTable } from "@/components";

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();
  return (
    <div className="container" style={{ paddingTop: 40 }}>
      <nav style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
        <button className="btn btn--ghost" onClick={() => setLang(lang === "en" ? "pt-BR" : "en")}>{lang === "en" ? "PT-BR" : "EN"}</button>
        <Link to="/login" className="btn btn--ghost">{t("login")}</Link>
        <Link to="/register" className="btn">{t("cta")}</Link>
      </nav>
      <header style={{ textAlign: "center", margin: "60px 0" }}>
        <h1 style={{ fontSize: 48 }}>{t("hero")}</h1>
        <p>Auth · Organizations · Stripe billing · Admin · API keys · Audit logs · Docker · CI/CD</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link to="/register" className="btn">{t("cta")}</Link>
          <Link to="/pricing" className="btn btn--ghost">{t("pricing")}</Link>
        </div>
      </header>
      <section id="features" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {["Organizations & invites", "Per-org Stripe subscriptions", "RBAC + admin panel", "API keys & audit logs", "Transactional email", "Docker + CI/CD"].map((f) => (
          <div key={f} className="card">{f}</div>
        ))}
      </section>
      <section style={{ margin: "60px 0" }}>
        <h2>{t("pricing")}</h2>
        <PricingTable />
      </section>
      <section className="card" style={{ marginBottom: 40 }}>
        <h3>FAQ</h3>
        <p><strong>How do organizations work?</strong> Each organization has members, roles, invites and its own Stripe subscription.</p>
        <p><strong>How is auth secured?</strong> HttpOnly cookies, 15m access + rotating 7d refresh, bcrypt-12, rate limits.</p>
      </section>
    </div>
  );
}
