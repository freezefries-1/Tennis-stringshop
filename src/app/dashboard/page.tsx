import { Dashboard } from "@/components/dashboard/dashboard";
import { listLowStockProducts as listLowStockStringProducts, listRecentMovements } from "@/lib/string-inventory";
import { listLowStockProducts as listLowStockRetailProducts } from "@/lib/products";
import { getDashboardSalesStats, listRecentSales } from "@/lib/sales";
import { getFinancialSummary, monthRange } from "@/lib/financials";
import { listRecentExpenses } from "@/lib/expenses";
import { getInventoryDefaults } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    (async () => listLowStockStringProducts(8, await defaultsPromise))(),
    (async () => listLowStockRetailProducts(8, await defaultsPromise))(),
    listRecentMovements(),
    getDashboardSalesStats(),
    listRecentSales(),
    getFinancialSummary({ dateFrom: monthFrom, dateTo: monthTo }),
    listRecentExpenses(5),
  ]);

  const lowStock = [
    ...lowStockStrings.map((s) => ({ kind: "string" as const, productId: s.productId, label: s.label, available: s.available, unit: s.unit as string, threshold: s.threshold, status: s.status })),
    ...lowStockRetail.map((p) => ({ kind: "product" as const, productId: p.productId, label: p.label, available: String(p.available), unit: "unit", threshold: String(p.threshold), status: p.status })),
  ].sort((a, b) => Number(a.available) - Number(b.available));

  return <Dashboard lowStock={lowStock} recentMovements={recentMovements} salesStats={salesStats} recentSales={recentSales} monthFinancials={monthFinancials} recentExpenses={recentExpenses} />;
}
