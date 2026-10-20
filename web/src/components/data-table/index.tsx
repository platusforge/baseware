import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "../skeleton";
import { Button } from "../button";
import { ColumnManager } from "../column-manager";
import { toast } from "../toast";
import { copyToClipboard } from "@/utils/clipboard";
import { exportToExcel } from "@/utils/excel";
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
  /** Click-to-copy cell: copies `value` (or the raw row field) to the clipboard. */
  copyable?: boolean;
};

export type DataTableLabels = {
  columns: string;
  moveUp: string;
  moveDown: string;
  reset: string;
  export: string;
  copy: string;
  copied: string;
};

const DEFAULT_LABELS: DataTableLabels = {
  columns: "Columns",
  moveUp: "Move up",
  moveDown: "Move down",
  reset: "Reset",
  export: "Export",
  copy: "Copy",
  copied: "Copied!",
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
  /** Left slot of the built-in toolbar (e.g. a SearchBar). */
  toolbar?: React.ReactNode;
  /** Shows the "Columns" popover: hide/show and reorder columns. */
  columnManager?: boolean;
  /** Persists column order/visibility in localStorage under this key. */
  storageKey?: string;
  /** Shows the Excel export button — exports visible columns over the current rows. */
  exportable?: boolean;
  exportFileName?: string;
  labels?: Partial<DataTableLabels>;
};

type StoredColumns = { order?: string[]; hidden?: string[] };

function loadStoredColumns(storageKey?: string): StoredColumns {
  if (!storageKey) return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredColumns;
    return {
      order: Array.isArray(parsed.order) ? parsed.order.filter((k) => typeof k === "string") : undefined,
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((k) => typeof k === "string") : undefined,
    };
  } catch {
    return {};
  }
}

function cellContent<T>(col: Column<T>, row: T) {
  if (col.render) return col.render(row);
  if (col.value) return col.value(row);
  const v = (row as Record<string, unknown>)[col.key];
  return v == null ? "—" : String(v);
}

function copyTextOf<T>(col: Column<T>, row: T): string | undefined {
  const v = col.value?.(row) ?? (row as Record<string, unknown>)[col.key];
  if (v == null || v === "") return undefined;
  return String(v);
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
  toolbar,
  columnManager = false,
  storageKey,
  exportable = false,
  exportFileName,
  labels,
}: Props<T>) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const headCheckRef = useRef<HTMLInputElement>(null);
  const stored = useMemo(() => loadStoredColumns(storageKey), [storageKey]);
  const [orderKeys, setOrderKeys] = useState<string[]>(stored.order ?? []);
  const [hiddenKeys, setHiddenKeys] = useState<string[]>(stored.hidden ?? []);

  const allKeys = columns.map((col) => col.key);
  const allKeysId = allKeys.join("|");

  /** Props order reconciled with the user's order: kept keys first, new keys appended. */
  const orderedKeys = useMemo(() => {
    const known = orderKeys.filter((k) => allKeys.includes(k));
    const added = allKeys.filter((k) => !known.includes(k));
    return [...known, ...added];
    // allKeys is derived from columns; allKeysId is the stable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKeys, allKeysId]);

  const visibleColumns = useMemo(() => {
    const result: Column<T>[] = [];
    for (const k of orderedKeys) {
      const col = columns.find((c) => c.key === k);
      if (col && !hiddenKeys.includes(col.key)) result.push(col);
    }
    return result;
    // allKeysId keeps this in sync when the columns prop shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedKeys, hiddenKeys, allKeysId]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ order: orderedKeys, hidden: hiddenKeys }));
    } catch {
      // ignore (storage blocked)
    }
  }, [storageKey, orderedKeys, hiddenKeys]);

  function toggleColumn(key: string, visible: boolean) {
    setHiddenKeys((prev) => {
      if (visible) return prev.filter((k) => k !== key);
      const next = [...new Set([...prev, key])];
      // Keep at least one column visible.
      return columns.length - next.length < 1 ? prev : next;
    });
  }

  function moveColumn(key: string, direction: -1 | 1) {
    setOrderKeys((prev) => {
      const known = prev.filter((k) => allKeys.includes(k));
      const added = allKeys.filter((k) => !known.includes(k));
      const current = [...known, ...added];
      const index = current.indexOf(key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return prev;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function resetColumns() {
    setOrderKeys([]);
    setHiddenKeys([]);
  }

  async function copyCell(text: string) {
    const ok = await copyToClipboard(text);
    if (ok) toast.success(L.copied);
  }

  function exportRows() {
    const stamp = new Date().toISOString().slice(0, 10);
    exportToExcel({
      fileName: `${exportFileName ?? "export"}-${stamp}`,
      sheetName: exportFileName ?? "Export",
      columns: visibleColumns.map((col) => ({
        label: col.label,
        value: (row: T) => {
          const v = col.value?.(row) ?? (row as Record<string, unknown>)[col.key];
          if (v == null) return "";
          return typeof v === "number" || typeof v === "boolean" ? v : String(v);
        },
      })),
      rows: data,
    });
  }

  const keys = data.map((row, i) => keyOf(row, i));
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

  const toolbarRow =
    toolbar || columnManager || exportable ? (
      <div className={styles.toolbar}>
        {toolbar && <div className={styles.toolbarStart}>{toolbar}</div>}
        <div className={styles.toolbarActions}>
          {columnManager && (
            <ColumnManager
              items={orderedKeys.map((k) => {
                const col = columns.find((c) => c.key === k);
                return { key: k, label: col?.label ?? k, visible: !hiddenKeys.includes(k) };
              })}
              onToggle={toggleColumn}
              onMove={moveColumn}
              onReset={resetColumns}
              label={L.columns}
              moveUpLabel={L.moveUp}
              moveDownLabel={L.moveDown}
              resetLabel={L.reset}
            />
          )}
          {exportable && (
            <Button type="button" variant="secondary" size="sm" disabled={data.length === 0} onClick={exportRows}>
              <svg className={styles.exportIcon} viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2v8m0 0 3-3M8 10 5 7M3 13h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {L.export}
            </Button>
          )}
        </div>
      </div>
    ) : null;

  if (!loading && data.length === 0) {
    return (
      <div className={styles.root}>
        {toolbarRow}
        <div className={styles.empty} role="status">
          <p className={styles.emptyTitle}>{emptyTitle}</p>
          {emptyHint && <p className={styles.emptyHint}>{emptyHint}</p>}
          {emptyAction}
        </div>
      </div>
    );
  }

  const colCount = visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  return (
    <div className={styles.root}>
      {toolbarRow}
      <div className={[styles.wrap, responsive === "scroll" ? styles.scroll : ""].filter(Boolean).join(" ")}>
      <table className={styles.table}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {selectable && (
              <th className={styles.checkCell}>
                <input ref={headCheckRef} type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all rows" />
              </th>
            )}
            {visibleColumns.map((col) => (
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
                  {visibleColumns.map((col) => (
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
                    {visibleColumns.map((col, ci) => {
                      const copyText = col.copyable ? copyTextOf(col, row) : undefined;
                      return (
                        <td
                          key={col.key}
                          data-label={col.label}
                          data-title={ci === 0 || undefined}
                          className={[styles[`align-${col.align ?? "left"}`], col.hideOnMobile ? styles.hideMobile : ""].filter(Boolean).join(" ")}
                        >
                          {copyText ? (
                            <button
                              type="button"
                              className={styles.copyCell}
                              onClick={() => copyCell(copyText)}
                              title={copyText}
                              aria-label={`${L.copy}: ${col.label}`}
                            >
                              {cellContent(col, row)}
                              <span className={styles.copyIcon} aria-hidden="true">
                                <svg viewBox="0 0 16 16">
                                  <path
                                    d="M5.5 5.5V3.6c0-.6.5-1.1 1.1-1.1h5.8c.6 0 1.1.5 1.1 1.1v5.8c0 .6-.5 1.1-1.1 1.1h-1.9M3.6 5.5h5.8c.6 0 1.1.5 1.1 1.1v5.8c0 .6-.5 1.1-1.1 1.1H3.6c-.6 0-1.1-.5-1.1-1.1V6.6c0-.6.5-1.1 1.1-1.1Z"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.3"
                                  />
                                </svg>
                              </span>
                            </button>
                          ) : (
                            cellContent(col, row)
                          )}
                        </td>
                      );
                    })}
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
    </div>
  );
}
