import { Dashboard } from "@/components/dashboard/dashboard";
import { listLowStockProducts as listLowStockStringProducts, listRecentMovements } from "@/lib/string-inventory";
import { listLowStockProducts as listLowStockRetailProducts } from "@/lib/products";
import { getDashboardSalesStats, listRecentSales } from "@/lib/sales";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [lowStockStrings, lowStockRetail, recentMovements, salesStats, recentSales] = await Promise.all([
    listLowStockStringProducts(),
    listLowStockRetailProducts(),
    listRecentMovements(),
    getDashboardSalesStats(),
    listRecentSales(),
  ]);

  const lowStock = [
    ...lowStockStrings.map((s) => ({ kind: "string" as const, productId: s.productId, label: s.label, available: s.available, unit: s.unit as string, threshold: s.threshold, status: s.status })),
    ...lowStockRetail.map((p) => ({ kind: "product" as const, productId: p.productId, label: p.label, available: String(p.available), unit: "unit", threshold: String(p.threshold), status: p.status })),
  ].sort((a, b) => Number(a.available) - Number(b.available));

  return <Dashboard lowStock={lowStock} recentMovements={recentMovements} salesStats={salesStats} recentSales={recentSales} />;
}
