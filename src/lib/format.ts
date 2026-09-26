export function formatMoney(n: number, dp?: number): string {
  return "$" + n.toLocaleString("en-SG", { minimumFractionDigits: dp ?? 2, maximumFractionDigits: dp ?? 2 });
}

export function formatMoney0(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-SG");
}

export function formatCents(cents: number): string {
  return formatMoney(cents / 100);
}

/** Same as formatCents, but a loss keeps its minus sign in the usual place
 * ("-$450.00") instead of "$-450.00" — Net Profit must be able to show a
 * loss without being clamped to zero. */
export function formatCentsSigned(cents: number): string {
  return cents < 0 ? `-${formatCents(-cents)}` : formatCents(cents);
}

// Singapore Time is a fixed UTC+8 year-round (no DST) — this app's one
// deployed business timezone (SGD, en-SG locale throughout). Without an
// explicit timeZone, toLocaleDateString uses whatever "local" means where
// the code executes — the server's runtime timezone (UTC on Vercel) for a
// Server Component, but the visiting browser's own timezone for a Client
// Component. Sale/job/expense dates got shown inconsistently depending on
// which kind of component happened to render them (e.g. the Sales list —
// a Client Component — vs. a Sale's own detail page — a Server Component
// — could disagree by a day for the same timestamp). Pinning every date
// display to Asia/Singapore explicitly makes it render identically no
// matter where the code runs.
const SG_TIMEZONE = "Asia/Singapore";
const SGT_OFFSET_MS = 8 * 60 * 60 * 1000;

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", timeZone: SG_TIMEZONE });
}

export function formatDateWithWeekday(d: Date | string): string {
  const date = new Date(d);
  const weekday = date.toLocaleDateString("en-SG", { weekday: "short", timeZone: SG_TIMEZONE });
  return `${weekday} ${formatDate(date)}`;
}

/** A timestamptz's calendar date as it falls in Singapore time, as
 * "YYYY-MM-DD" for a date input's value — NOT the same as
 * toISOString().slice(0, 10), which gives the UTC date instead. */
export function toSGDateInputValue(d: Date | string): string {
  return new Date(new Date(d).getTime() + SGT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Corrects only the calendar-date portion of a timestamptz to a given
 * Singapore date (e.g. from a date input), keeping the existing
 * timestamp's Singapore time-of-day exactly as it was — computed via
 * explicit UTC math so it can't drift with the server's own runtime
 * timezone the way naive local-time Date methods would. */
export function withSGDate(sgDate: string, existing: Date): Date {
  const [year, month, day] = sgDate.split("-").map(Number);
  const sgtWallClock = new Date(existing.getTime() + SGT_OFFSET_MS);
  const newSgtWallClockMs = Date.UTC(year, month - 1, day, sgtWallClock.getUTCHours(), sgtWallClock.getUTCMinutes(), sgtWallClock.getUTCSeconds(), sgtWallClock.getUTCMilliseconds());
  return new Date(newSgtWallClockMs - SGT_OFFSET_MS);
}

