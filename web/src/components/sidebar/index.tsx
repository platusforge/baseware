import { NavLink } from "react-router-dom";
import styles from "./index.module.css";

export type SidebarItem = {
  key: string;
  label: string;
  to: string;
  icon: React.ReactNode;
};

type NavProps = {
  items: SidebarItem[];
  navLabel?: string;
  /** Hide labels and rely on the item title/aria-label (collapsed shell). */
  collapsed?: boolean;
  className?: string;
};

/** Shared nav rendering — used by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ items, navLabel, collapsed = false, className }: NavProps) {
  return (
    <nav className={[styles.nav, className ?? ""].filter(Boolean).join(" ")} aria-label={navLabel}>
      {items.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          end
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
          className={({ isActive }) => [styles.item, isActive ? styles.itemActive : ""].filter(Boolean).join(" ")}
        >
          <span className={styles.icon} aria-hidden="true">
            {item.icon}
          </span>
          <span className={styles.label}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

type Props = {
  items: SidebarItem[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  navLabel?: string;
  collapseLabel?: string;
  expandLabel?: string;
};

/**
 * Desktop sidebar shell: sticky column with header slot, nav and footer slot.
 * Collapses to an icon rail (state is owned by the consumer).
 */
export function Sidebar({
  items,
  collapsed,
  onToggleCollapse,
  header,
  footer,
  navLabel,
  collapseLabel = "Collapse sidebar",
  expandLabel = "Expand sidebar",
}: Props) {
  const toggleLabel = collapsed ? expandLabel : collapseLabel;

  return (
    <aside className={[styles.sidebar, collapsed ? styles.collapsed : ""].filter(Boolean).join(" ")}>
      {header && <div className={styles.header}>{header}</div>}

      <SidebarNav items={items} navLabel={navLabel} collapsed={collapsed} />

      <div className={styles.bottom}>
        <button type="button" className={styles.collapse} onClick={onToggleCollapse} aria-label={toggleLabel} title={toggleLabel}>
          <svg className={styles.collapseIcon} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.label}>{toggleLabel}</span>
        </button>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </aside>
  );
}
