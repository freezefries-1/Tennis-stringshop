// Shared CSV helpers for Phase 8's report exports — expenses.ts and
// other-income.ts each carry their own tiny copy of this (built in earlier,
// separate phases); this is the one shared version for everything Phase 8
// adds, so five new export functions don't each duplicate it.

export function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))];
  return lines.join("\n");
}
