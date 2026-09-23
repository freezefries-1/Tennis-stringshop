// Shared date-range-preset resolution for Expenses and Financials (Sales
// keeps its own smaller copy — today/week/month/last_month/year/custom —
// shipped in Phase 6 and left alone rather than risk a regression to
// something already working; this is the superset Phase 7 needs, with
// quarter/last_year added per the Financials brief).
//
// Every preset resolves to a [start, end) pair in the BROWSER's local
// time — end exclusive — which the caller serializes via toISOString()
// before pushing into the URL, so the server itself never needs timezone
// logic; it just filters by whatever exact instant it's given. This is
// the same pattern the Sales list's date filter already established.

export type DateFilterPreset = "all" | "today" | "week" | "month" | "last_month" | "quarter" | "year" | "last_year" | "custom";

export const DATE_FILTER_LABEL: Record<DateFilterPreset, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
  last_month: "Last month",
  quarter: "This quarter",
  year: "This year",
  last_year: "Last year",
  custom: "Custom range",
};

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toLocalDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseLocalDateInput(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** [start, end) — both null means no filtering (All time, or Custom range
 * with neither date filled in yet). */
export function presetRange(filter: DateFilterPreset, customFrom: string, customTo: string): [Date | null, Date | null] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "today": {
      const end = new Date(startOfToday);
      end.setDate(end.getDate() + 1);
      return [startOfToday, end];
    }
    case "week": {
      const day = startOfToday.getDay();
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday start
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return [start, end];
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return [start, end];
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return [start, end];
    }
    case "quarter": {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), qStartMonth, 1);
      const end = new Date(now.getFullYear(), qStartMonth + 3, 1);
      return [start, end];
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return [start, end];
    }
    case "last_year": {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear(), 0, 1);
      return [start, end];
    }
    case "custom": {
      const start = parseLocalDateInput(customFrom);
      const toDate = parseLocalDateInput(customTo);
      const end = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1) : null;
      return [start, end];
    }
    default:
      return [null, null];
  }
}

/** Reverse-engineers which preset (if any) the current from/to correspond
 * to, by comparing against what each preset resolves to right now — so a
 * dropdown's selection is always derived from the actual filter in
 * effect, never a separate piece of state that could drift out of sync. */
export function detectPreset(fromISO: string, toISO: string): DateFilterPreset {
  if (!fromISO && !toISO) return "all";
  for (const f of ["today", "week", "month", "last_month", "quarter", "year", "last_year"] as DateFilterPreset[]) {
    const [s, e] = presetRange(f, "", "");
    if ((s?.toISOString() ?? "") === fromISO && (e?.toISOString() ?? "") === toISO) return f;
  }
  return "custom";
}
