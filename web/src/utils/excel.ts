import { downloadBlob } from "./download";

export type ExcelColumn<T> = {
  label: string;
  /** Cell value: numbers/booleans stay typed, everything else becomes text. */
  value: (row: T) => unknown;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function sanitizeSheetName(name: string): string {
  const safe = name.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31);
  return escapeXml(safe || "Sheet1");
}

function cell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "<Cell/>";
  if (typeof value === "number" && Number.isFinite(value)) return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  if (typeof value === "boolean") return `<Cell><Data ss:Type="Boolean">${value ? 1 : 0}</Data></Cell>`;
  return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
}

/**
 * Zero-dependency Excel export (SpreadsheetML 2003, `.xls`): opens natively in
 * Excel, LibreOffice and Google Sheets, keeps numbers/booleans typed and styles
 * the header row. No runtime libraries required.
 */
export function exportToExcel<T>(options: { fileName: string; sheetName?: string; columns: ExcelColumn<T>[]; rows: T[] }): void {
  const { fileName, sheetName = "Sheet1", columns, rows } = options;

  const headerRow = `<Row>${columns
    .map((col) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(col.label)}</Data></Cell>`)
    .join("")}</Row>`;
  const bodyRows = rows.map((row) => `<Row>${columns.map((col) => cell(col.value(row))).join("")}</Row>`).join("");

  const xml =
    `<?xml version="1.0"?>\n` +
    `<?mso-application progid="Excel.Sheet"?>\n` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n` +
    `<Styles><Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#EEF2FF" ss:Pattern="Solid"/></Style></Styles>\n` +
    `<Worksheet ss:Name="${sanitizeSheetName(sheetName)}"><Table>${headerRow}${bodyRows}</Table></Worksheet>\n` +
    `</Workbook>`;

  downloadBlob(new Blob([xml], { type: "application/vnd.ms-excel" }), `${fileName}.xls`);
}
