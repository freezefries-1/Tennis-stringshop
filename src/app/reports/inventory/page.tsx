import { getInventoryValueOverview, listStringMovement, listProductMovement, getStockCoverEstimates, listSlowMovingInventory, getInventoryPurchaseContext } from "@/lib/reports-inventory";
import { getFinancialSummary } from "@/lib/financials";
import { resolveDateParams } from "@/lib/date-filter";
import { InventoryReportsView } from "@/components/reports/inventory-reports-view";

export const dynamic = "force-dynamic";

export default async function InventoryReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { dateFrom, dateTo } = resolveDateParams(sp);
  const filters = { dateFrom, dateTo };

  const [overview, stringMovement, productMovement, stockCover, slowMoving, purchaseContext, summary] = await Promise.all([
    getInventoryValueOverview(),
    listStringMovement(),
    listProductMovement(),
    getStockCoverEstimates(),
    listSlowMovingInventory(90),
    getInventoryPurchaseContext(dateFrom, dateTo),
    getFinancialSummary(filters),
  ]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Inventory reports</h2>
      <InventoryReportsView
        overview={overview}
        stringMovement={stringMovement}
        productMovement={productMovement}
        stockCover={stockCover}
        slowMoving={slowMoving}
        purchaseContext={purchaseContext}
        cogsCents={summary.cogsCents}
        initialFrom={sp.from ?? ""}
        initialTo={sp.to ?? ""}
      />
    </div>
  );
}
