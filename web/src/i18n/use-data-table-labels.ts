import { useMemo } from "react";
import type { DataTableLabels } from "@/components/data-table";
import { useI18n } from "@/contexts/i18n-context";

/** Localized DataTable labels (sorting, selection, copy, column manager, export). */
export function useDataTableLabels(): DataTableLabels {
  const { t } = useI18n();
  return useMemo(
    () => ({
      columns: t("columns"),
      moveUp: t("moveUp"),
      moveDown: t("moveDown"),
      reset: t("resetColumns"),
      export: t("exportExcel"),
      copy: t("copyCell"),
      copied: t("copied"),
      sortBy: t("sortBy"),
      selectAllRows: t("selectAllRows"),
      selectRow: t("selectRow"),
      select: t("selectLabel"),
      actions: t("actions"),
      selected: (count: number) => t("selected", { count }),
    }),
    [t],
  );
}
