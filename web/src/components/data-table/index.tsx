import { useEffect, useRef } from "react";
import { Skeleton } from "../skeleton";
import styles from "./index.module.css";

export type SortDir = "asc" | "desc";

export type Column<T> = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  /** Hidden on viewports below 720px (stays visible in card layout). */
  hideOnMobile?: boolean;
  render?: (row: T) => React.ReactNode;
  value?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  keyOf: (row: T, index: number) => string;
  loading?: boolean;
  loadingRows?: number;
  emptyTitle?: string;
  emptyHint?: string;
  emptyAction?: React.ReactNode;
  sort?: { key: string; dir: SortDir } | null;
  onSort?: (key: string) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectionChange?: (keys: string[]) => void;
  rowActions?: (row: T) => React.ReactNode;
  /** "cards" (default): rows become stacked cards on mobile. "scroll": horizontal scroll. */
  responsive?: "cards" | "scroll";
  caption?: string;
};

function cellContent<T>(col: Column<T>, row: T) {
  if (col.render) return col.render(row);
  if (col.value) return col.value(row);
  const v = (row as Record<string, unknown>)[col.key];
  return v == null ? "—" : String(v);
}

export function DataTable<T>({
  columns,
  data,
  keyOf,
  loading = false,
  loadingRows = 5,
  emptyTitle = "No results",
  emptyHint,
  emptyAction,
  sort,
  onSort,
  selectable = false,
  selected = [],
  onSelectionChange,
  rowActions,
  responsive = "cards",
  caption,
}: Props<T>) {
  const headCheckRef = useRef<HTMLInputElement>(null);
  const keys = data.map((r, i) => keyOf(r, i));
  const allChecked = data.length > 0 && keys.every((k) => selected.includes(k));
  const someChecked = keys.some((k) => selected.includes(k));

  useEffect(() => {
    if (headCheckRef.current) headCheckRef.current.indeterminate = !allChecked && someChecked;
  }, [allChecked, someChecked]);

  function toggleAll() {
    if (!onSelectionChange) return;
    onSelectionChange(allChecked ? selected.filter((k) => !keys.includes(k)) : [...new Set([...selected, ...keys])]);
  }

  function toggleOne(key: string) {
    if (!onSelectionChange) return;
    onSelectionChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  }

  const colCount = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  if (!loading && data.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        {emptyHint && <p className={styles.emptyHint}>{emptyHint}</p>}
        {emptyAction}
      </div>
    );
  }

  return (
    <div className={[styles.wrap, responsive === "scroll" ? styles.scroll : ""].filter(Boolean).join(" ")}>
      <table className={styles.table}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th className={styles.checkCell}>
                <input
                  ref={headCheckRef}
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                aria-sort={sort?.key === col.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                className={[styles[`align-${col.align ?? "left"}`], col.hideOnMobile ? styles.hideMobile : ""].filter(Boolean).join(" ")}
              >
                {col.sortable && onSort ? (
                  <button type="button" className={styles.sortBtn} onClick={() => onSort(col.key)} aria-label={`Sort by ${col.label}`}>
                    {col.label}
                    <span aria-hidden="true" className={styles.arrow}>
                      {sort?.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : "⇅"}
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {rowActions && <th><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={styles.cardRow}>
                  {selectable && <td className={styles.checkCell}><Skeleton width={18} height={18} /></td>}
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.label} className={col.hideOnMobile ? styles.hideMobile : ""}>
                      <Skeleton height={14} />
                    </td>
                  ))}
                  {rowActions && <td><Skeleton height={14} /></td>}
                </tr>
              ))
            : data.map((row, i) => {
                const key = keyOf(row, i);
                return (
                  <tr key={key} className={styles.cardRow}>
                    {selectable && (
                      <td className={styles.checkCell} data-label="Select">
                        <input
                          type="checkbox"
                          checked={selected.includes(key)}
                          onChange={() => toggleOne(key)}
                          aria-label={`Select row ${i + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col, ci) => (
                      <td
                        key={col.key}
                        data-label={col.label}
                        data-title={ci === 0 || undefined}
                        className={[styles[`align-${col.align ?? "left"}`], col.hideOnMobile ? styles.hideMobile : ""].filter(Boolean).join(" ")}
                      >
                        {cellContent(col, row)}
                      </td>
                    ))}
                    {rowActions && <td data-label="Actions" className={styles.actions}>{rowActions(row)}</td>}
                  </tr>
                );
              })}
        </tbody>
      </table>
      {selectable && someChecked && (
        <p className={styles.selection} role="status">{selected.length} selected</p>
      )}
      <span className="sr-only">{`Table with ${colCount} columns`}</span>
    </div>
  );
}
