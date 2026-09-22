import { Dashboard } from "@/components/dashboard/dashboard";
import { listLowStockProducts, listRecentMovements } from "@/lib/string-inventory";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [lowStock, recentMovements] = await Promise.all([listLowStockProducts(), listRecentMovements()]);
  return <Dashboard lowStock={lowStock} recentMovements={recentMovements} />;
}
