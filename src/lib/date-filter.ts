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

/** Every Reports page's server component does exactly this: `sp.from`/
 * `sp.to` are full ISO instants (the client resolves "this month" etc. in
 * local time and serializes the exact boundary — see DateRangePicker),
 * parsed unambiguously regardless of where the server itself runs. Missing
 * means All time (both null), matching Financials' own convention. */
export function resolveDateParams(sp: { from?: string; to?: string }): { dateFrom: Date | null; dateTo: Date | null } {
  return { dateFrom: sp.from ? new Date(sp.from) : null, dateTo: sp.to ? new Date(sp.to) : null };
}

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

// -- period comparison (Phase 8 §3/§12/§54) ----------------------------------
//
// "Compare to the previous equivalent period" — September vs August, Q3 vs
// Q2, this year vs last year. Always computed by shifting the CURRENT
// [start, end) window back by its own exact length, never by re-resolving a
// different preset — a custom 17-day range's "previous period" is the 17
// days immediately before it, not "last month". "All time" has no
// meaningful previous period (there's nothing before it by definition) and
// returns [null, null].

/** [start, end) immediately preceding [from, to), the same length. Null in
 * either input (All time, or Custom with a date still blank) means there's
 * no well-defined previous period either. */
export function previousPeriod(from: Date | null, to: Date | null): [Date | null, Date | null] {
  if (!from || !to) return [null, null];
  const lengthMs = to.getTime() - from.getTime();
  return [new Date(from.getTime() - lengthMs), from];
}

/** Percentage change from `previous` to `current`, or null when it can't be
 * expressed meaningfully — previous is zero (division by zero) or previous
 * is negative (a "% change" against a negative base is not a number anyone
 * reads sensibly). Callers show "—" for null, never Infinity/NaN/a
 * fabricated 0%. See Phase 8 §3/§54 — this is the one place that decision
 * is made, so every comparison card agrees on when a percentage is shown. */
export function safePctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
