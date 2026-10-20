import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { PageHeader, StatCard } from "@/components";
import { useOrganization } from "@/contexts/organization-context";
import { useI18n } from "@/contexts/i18n-context";
import styles from "./index.module.css";

type Status = { plan: string; status: string };

export default function DashboardIndex() {
  const { current } = useOrganization();
  const { t } = useI18n();
  const [status, setStatus] = useState<Status | null>(null);
  const [members, setMembers] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!current) return;
    setLoading(true);
    Promise.all([
      api.get<Status>(`/billing/status?orgId=${current.id}`, current.id).catch(() => null),
      api.get<{ userId: string }[]>(`/organizations/${current.id}/members`, current.id).catch(() => []),
    ])
      .then(([s, m]) => {
        if (s) setStatus(s);
        setMembers(m?.length ?? 0);
      })
      .finally(() => setLoading(false));
  }, [current]);

  const quick = [
    { to: "/dashboard/members", title: t("qaMembersTitle"), desc: t("qaMembersDesc"), icon: <UsersIcon /> },
    { to: "/dashboard/api-keys", title: t("qaKeysTitle"), desc: t("qaKeysDesc"), icon: <KeyIcon /> },
    { to: "/dashboard/billing", title: t("qaBillingTitle"), desc: t("qaBillingDesc"), icon: <CardIcon /> },
    { to: "/dashboard/settings", title: t("qaSettingsTitle"), desc: t("qaSettingsDesc"), icon: <GearIcon /> },
  ];

  return (
    <div>
      <PageHeader title={t("overview")} subtitle={current ? `${current.name} · ${current.plan}` : t("overviewSubtitle")} />

      <div className={styles.grid}>
        <StatCard label={t("billingSubtitle")} value={status?.plan ?? current?.plan ?? "—"} loading={loading} />
        <StatCard label={t("members")} value={String(members)} loading={loading} />
        <StatCard label={t("status")} value={status?.status ?? "—"} loading={loading} />
      </div>

      <h2 className={styles.sectionTitle}>{t("quickActions")}</h2>
      <div className={styles.quickGrid}>
        {quick.map((q) => (
          <Link key={q.to} to={q.to} className={styles.quickCard}>
            <span className={styles.quickIcon} aria-hidden="true">
              {q.icon}
            </span>
            <span className={styles.quickText}>
              <span className={styles.quickTitle}>{q.title}</span>
              <span className={styles.quickDesc}>{q.desc}</span>
            </span>
            <span className={styles.quickArrow} aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M15 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 10-10m-4 4 3 3" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.86a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.08 4.1l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" />
    </svg>
  );
}
