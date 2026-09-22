export function formatMoney(n: number, dp?: number): string {
  return "$" + n.toLocaleString("en-SG", { minimumFractionDigits: dp ?? 2, maximumFractionDigits: dp ?? 2 });
}

export function formatMoney0(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-SG");
}

export function formatCents(cents: number): string {
  return formatMoney(cents / 100);
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

