import { Dashboard } from "@/components/dashboard/dashboard";
import { listLowStockProducts as listLowStockStringProducts, listRecentMovements } from "@/lib/string-inventory";
import { listLowStockProducts as listLowStockRetailProducts } from "@/lib/products";
import { getDashboardSalesStats, listRecentSales } from "@/lib/sales";
import { getFinancialSummary, monthRange } from "@/lib/financials";
import { listRecentExpenses } from "@/lib/expenses";
import { getInventoryDefaults } from "@/lib/settings";

export const dynamic = "force-dynamic";

// TEMPORARY — production timeout diagnosis (remove once the live 504 is
// confirmed resolved). Times each of the Dashboard's top-level parallel
// queries independently so a slow one shows up by name in server logs
// instead of only a single opaque total. No request/customer data logged,
// only query name + duration + row/shape info.
async function timed<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  console.log(`[dashboard timing] ${name}: ${Date.now() - start}ms`);
  return result;
}

// Pulled out of the component body — React's purity rule flags Date.now()
// called directly during render, even in an async Server Component, so the
// timed data-fetching lives in its own plain async function instead.
async function loadDashboardData() {
  const pageStart = Date.now();
  const now = new Date();
  const [monthFrom, monthTo] = monthRange(now.getFullYear(), now.getMonth() + 1);

  // Fired once, alongside everything else below (not awaited yet) — both
  // low-stock queries await this SAME promise instead of each calling
  // getInventoryDefaults() separately, so it's one DB round trip instead of
  // two, without adding a serial hop in front of the rest of the page.
  const defaultsPromise = getInventoryDefaults();

  // Year-to-date was dropped from here (brief §46 only asks for THIS
  // month's figures) — getFinancialSummary alone is ~10 queries, so a
  // second call just for YTD roughly doubled the dashboard's DB work for a
  // number nobody explicitly asked for, and was pushing this page past
  // Vercel's function timeout in production. Full YTD is still one click
  // away on /financials (set the range to "This year").
  const [lowStockStrings, lowStockRetail, recentMovements, salesStats, recentSales, monthFinancials, recentExpenses] = await Promise.all([
    timed("listLowStockStringProducts", async () => listLowStockStringProducts(8, await defaultsPromise)),
    timed("listLowStockRetailProducts", async () => listLowStockRetailProducts(8, await defaultsPromise)),
    timed("listRecentMovements", () => listRecentMovements()),
    timed("getDashboardSalesStats", () => getDashboardSalesStats()),
    timed("listRecentSales", () => listRecentSales()),
    timed("getFinancialSummary (month)", () => getFinancialSummary({ dateFrom: monthFrom, dateTo: monthTo })),
    timed("listRecentExpenses", () => listRecentExpenses(5)),
  ]);
  console.log(`[dashboard timing] TOTAL: ${Date.now() - pageStart}ms`);

  const lowStock = [
    ...lowStockStrings.map((s) => ({ kind: "string" as const, productId: s.productId, label: s.label, available: s.available, unit: s.unit as string, threshold: s.threshold, status: s.status })),
    ...lowStockRetail.map((p) => ({ kind: "product" as const, productId: p.productId, label: p.label, available: String(p.available), unit: "unit", threshold: String(p.threshold), status: p.status })),
  ].sort((a, b) => Number(a.available) - Number(b.available));

  return { lowStock, recentMovements, salesStats, recentSales, monthFinancials, recentExpenses };
}

export default async function DashboardPage() {
  const { lowStock, recentMovements, salesStats, recentSales, monthFinancials, recentExpenses } = await loadDashboardData();
  return <Dashboard lowStock={lowStock} recentMovements={recentMovements} salesStats={salesStats} recentSales={recentSales} monthFinancials={monthFinancials} recentExpenses={recentExpenses} />;
}
