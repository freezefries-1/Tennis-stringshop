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

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateWithWeekday(d: Date | string): string {
  const date = new Date(d);
  const weekday = date.toLocaleDateString("en-SG", { weekday: "short" });
  return `${weekday} ${formatDate(date)}`;
}

