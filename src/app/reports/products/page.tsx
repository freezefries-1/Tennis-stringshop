import { getProductAnalytics, listTopProductsByUnits, listTopProductsByRevenue, listTopProductsByGrossProfit, listProductCategoryAnalysis } from "@/lib/reports-products";
import { resolveDateParams } from "@/lib/date-filter";
import { ProductReportsView } from "@/components/reports/product-reports-view";

export const dynamic = "force-dynamic";

export default async function ProductReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const filters = resolveDateParams(sp);

  const [analytics, topByUnits, topByRevenue, topByGrossProfit, categoryAnalysis] = await Promise.all([
    getProductAnalytics(filters),
    listTopProductsByUnits(filters),
    listTopProductsByRevenue(filters),
    listTopProductsByGrossProfit(filters),
    listProductCategoryAnalysis(filters),
  ]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Product reports</h2>
      <ProductReportsView
        analytics={analytics}
        topByUnits={topByUnits}
        topByRevenue={topByRevenue}
        topByGrossProfit={topByGrossProfit}
        categoryAnalysis={categoryAnalysis}
        initialFrom={sp.from ?? ""}
        initialTo={sp.to ?? ""}
      />
    </div>
  );
}
