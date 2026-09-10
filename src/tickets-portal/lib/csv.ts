/**
 * RFC-4180 CSV, with two extra safeties:
 *  - fields starting with = + - @ (or tab/CR) are prefixed with `'` so a
 *    spreadsheet does not evaluate applicant-supplied text as a formula;
 *  - a leading BOM so Excel opens UTF-8 correctly.
 */
function csvCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv<T>(
  columns: { header: string; value: (row: T) => unknown }[],
  rows: T[],
): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => csvCell(c.value(row))).join(','));
  }
  return '﻿' + lines.join('\r\n');
}
