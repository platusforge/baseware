import { interpolate } from "@/i18n";
import styles from "./index.module.css";

export type PaginationLabels = {
  navigation: string;
  rows: string;
  rowsPerPage: string;
  previous: string;
  next: string;
  /** Template with {{page}}. */
  page: string;
  /** Template with {{page}} and {{total}}. */
  pageOf: string;
};

const DEFAULT_LABELS: PaginationLabels = {
  navigation: "Pagination",
  rows: "Rows",
  rowsPerPage: "Rows per page",
  previous: "Previous page",
  next: "Next page",
  page: "Page {{page}}",
  pageOf: "Page {{page}} of {{total}}",
};

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  labels?: Partial<PaginationLabels>;
};

function pageList(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, page - 1, page, page + 1, total - 1, total].filter((n) => n >= 1 && n <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("…");
  }
  return out;
}

export function Pagination({ page, totalPages, onChange, pageSize, pageSizeOptions, onPageSizeChange, labels }: Props) {
  const L = { ...DEFAULT_LABELS, ...labels };

  if (totalPages <= 1 && !onPageSizeChange) return null;

  return (
    <nav className={styles.nav} aria-label={L.navigation}>
      {onPageSizeChange && pageSizeOptions && (
        <label className={styles.size}>
          <span className={styles.sizeLabel}>{L.rows}</span>
          <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} aria-label={L.rowsPerPage}>
            {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      <span className={styles.compact} aria-current="page">{interpolate(L.pageOf, { page, total: totalPages })}</span>
      <div className={styles.pages}>
        <button type="button" className={styles.btn} disabled={page <= 1} aria-label={L.previous} onClick={() => onChange(page - 1)}>‹</button>
        {pageList(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className={styles.gap} aria-hidden="true">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={[styles.btn, p === page ? styles.current : ""].filter(Boolean).join(" ")}
              aria-label={interpolate(L.page, { page: p })}
              aria-current={p === page ? "page" : undefined}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button type="button" className={styles.btn} disabled={page >= totalPages} aria-label={L.next} onClick={() => onChange(page + 1)}>›</button>
      </div>
    </nav>
  );
}
