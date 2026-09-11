export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
      <div>
        <h1 style={{ margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ color: "var(--color-text-secondary)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
