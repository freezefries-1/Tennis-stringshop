import { Dashboard } from "@/components/dashboard/dashboard";
import { listLowStockProducts as listLowStockStringProducts, listRecentMovements } from "@/lib/string-inventory";
import { listLowStockProducts as listLowStockRetailProducts } from "@/lib/products";
import { getDashboardSalesStats, listRecentSales } from "@/lib/sales";
import { getFinancialSummary, getPeriodComparison, getSalesSplit, getMonthlyTrend, monthRange } from "@/lib/financials";
import { listRecentExpenses } from "@/lib/expenses";
import { getInventoryDefaults } from "@/lib/settings";
import { getStringJobCountForPeriod, getPopularStrings } from "@/lib/reports-stringing";
import { getActiveJobCount, listReadyForCollection, listRecentJobsForDashboard } from "@/lib/jobs";
import { getTopCustomers, getCustomerAnalyticsSummary } from "@/lib/reports-customers";
import { getInventoryValueOverview } from "@/lib/reports-inventory";
import { resolveDateParams } from "@/lib/date-filter";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  // Default period is This month (Phase 8 §3) when the URL carries no
  // range yet — every other preset is one click away via the date filter.
  const now = new Date();
  const [defaultFrom, defaultTo] = monthRange(now.getFullYear(), now.getMonth() + 1);
  const { dateFrom, dateTo } = sp.from || sp.to ? resolveDateParams(sp) : { dateFrom: defaultFrom, dateTo: defaultTo };
  const filters = { dateFrom, dateTo };

  // Fired once, alongside everything else below (not awaited yet) — both
  // low-stock queries await this SAME promise instead of each calling
  // getInventoryDefaults() separately, so it's one DB round trip instead of
  // two, without adding a serial hop in front of the rest of the page.
  const defaultsPromise = getInventoryDefaults();

  // Query budget note (kept here deliberately, next to the calls it's
  // describing): this page sits on the connection-pool math the earlier
  // 504 fix worked out (src/db/client.ts's `max` comment, migration 0015's
  // report) — every call below is either already-minimal (the pre-Phase-8
  // 7 calls, ~23 DB round trips total) or was picked specifically for being
  // ONE query (getStringJobCountForPeriod) or reusing data already being
  // fetched (getPeriodComparison takes the summary below instead of
  // re-fetching it — see its own comment in financials.ts). Detailed
  // trend/breakdown charts (Revenue & Profit Trend, String Jobs Trend,
  // Expenses by Category — Phase 8 §7) deliberately link out to /reports
  // instead of duplicating those queries here, per §43: "the Dashboard
  // should NOT wait for every detailed analytics report to calculate."
  // Top customers / customer insights / inventory value / popular strings /
  // revenue trend (this block) are new cards the Dashboard redesign added —
  // each one reuses the cheapest existing function for its figure (see the
  // comment on each: getTopCustomers/getPopularStrings are dedicated
  // single-query dashboard variants of their heavier Reports-page
  // equivalents; getCustomerAnalyticsSummary/getInventoryValueOverview/
  // getMonthlyTrend are reused as-is, either because the logic they encode
  // is centralized on purpose (new/returning) or because they were already
  // cheap enough to share (inventory value, monthly trend).
  const [lowStockStrings, lowStockRetail, recentMovements, salesStats, recentSales, summary, recentExpenses, salesSplit, stringJobCount, readyForCollection, recentJobs, activeJobCount, topCustomers, customerInsights, inventoryValue, popularStrings, monthlyTrend] = await Promise.all([
    (async () => listLowStockStringProducts(8, await defaultsPromise))(),
    (async () => listLowStockRetailProducts(8, await defaultsPromise))(),
    listRecentMovements(),
    getDashboardSalesStats(),
    listRecentSales(),
    getFinancialSummary(filters),
    listRecentExpenses(5),
    getSalesSplit(filters),
    getStringJobCountForPeriod(filters),
    listReadyForCollection(5),
    listRecentJobsForDashboard(5),
    getActiveJobCount(),
    getTopCustomers(filters, 5),
    getCustomerAnalyticsSummary(filters),
    getInventoryValueOverview(),
    getPopularStrings(filters, 5),
    getMonthlyTrend(6),
  ]);

  const comparison = await getPeriodComparison(filters, summary);

  const lowStock = [
    ...lowStockStrings.map((s) => ({ kind: "string" as const, productId: s.productId, label: s.label, available: s.available, unit: s.unit as string, threshold: s.threshold, status: s.status })),
    ...lowStockRetail.map((p) => ({ kind: "product" as const, productId: p.productId, label: p.label, available: String(p.available), unit: "unit", threshold: String(p.threshold), status: p.status })),
  ].sort((a, b) => Number(a.available) - Number(b.available));

  return (
    <Dashboard
      lowStock={lowStock}
      recentMovements={recentMovements}
      salesStats={salesStats}
      recentSales={recentSales}
      monthFinancials={summary}
      recentExpenses={recentExpenses}
      salesSplit={salesSplit}
      stringJobCount={stringJobCount}
      comparison={comparison}
      readyForCollection={readyForCollection}
      recentJobs={recentJobs}
      activeJobCount={activeJobCount}
      topCustomers={topCustomers}
      customerInsights={customerInsights}
      inventoryValue={inventoryValue}
      popularStrings={popularStrings}
      monthlyTrend={monthlyTrend}
      initialFrom={dateFrom ? dateFrom.toISOString() : ""}
      initialTo={dateTo ? dateTo.toISOString() : ""}
    />
  );
}
