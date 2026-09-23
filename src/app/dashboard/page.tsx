import { Dashboard } from "@/components/dashboard/dashboard";
import { listLowStockProducts as listLowStockStringProducts, listRecentMovements } from "@/lib/string-inventory";
import { listLowStockProducts as listLowStockRetailProducts } from "@/lib/products";
import { getDashboardSalesStats, listRecentSales } from "@/lib/sales";
import { getFinancialSummary, monthRange } from "@/lib/financials";
import { listRecentExpenses } from "@/lib/expenses";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const [monthFrom, monthTo] = monthRange(now.getFullYear(), now.getMonth() + 1);
  const yearFrom = new Date(now.getFullYear(), 0, 1);
  const yearTo = new Date(now.getFullYear() + 1, 0, 1);

  const [lowStockStrings, lowStockRetail, recentMovements, salesStats, recentSales, monthFinancials, yearFinancials, recentExpenses] = await Promise.all([
    listLowStockStringProducts(),
    listLowStockRetailProducts(),
    listRecentMovements(),
    getDashboardSalesStats(),
    listRecentSales(),
    getFinancialSummary({ dateFrom: monthFrom, dateTo: monthTo }),
    getFinancialSummary({ dateFrom: yearFrom, dateTo: yearTo }),
    listRecentExpenses(5),
  ]);

  const lowStock = [
    ...lowStockStrings.map((s) => ({ kind: "string" as const, productId: s.productId, label: s.label, available: s.available, unit: s.unit as string, threshold: s.threshold, status: s.status })),
    ...lowStockRetail.map((p) => ({ kind: "product" as const, productId: p.productId, label: p.label, available: String(p.available), unit: "unit", threshold: String(p.threshold), status: p.status })),
  ].sort((a, b) => Number(a.available) - Number(b.available));

  return <Dashboard lowStock={lowStock} recentMovements={recentMovements} salesStats={salesStats} recentSales={recentSales} monthFinancials={monthFinancials} yearFinancials={yearFinancials} recentExpenses={recentExpenses} />;
}
