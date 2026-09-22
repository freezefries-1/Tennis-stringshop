export function formatMoney(n: number, dp?: number): string {
  return "$" + n.toLocaleString("en-SG", { minimumFractionDigits: dp ?? 2, maximumFractionDigits: dp ?? 2 });
}

export function formatMoney0(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-SG");
}
