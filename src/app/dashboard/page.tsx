import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard/dashboard";
import { RevenueTrendSection } from "@/components/dashboard/revenue-trend-section";
import { CustomersInventorySection } from "@/components/dashboard/customers-inventory-section";
import { SectionSkeleton } from "@/components/dashboard/section-skeleton";
import { listLowStockProducts as listLowStockStringProducts, listRecentMovements } from "@/lib/string-inventory";
import { listLowStockProducts as listLowStockRetailProducts } from "@/lib/products";
import { getDashboardSalesStats, listRecentSales } from "@/lib/sales";
import { getFinancialSummary, getPeriodComparison, getSalesSplit, monthRange } from "@/lib/financials";
import { listRecentExpenses } from "@/lib/expenses";
import { getInventoryDefaults } from "@/lib/settings";
import { getStringJobCountForPeriod } from "@/lib/reports-stringing";
import { getActiveJobCount, listReadyForCollection, listRecentJobsForDashboard } from "@/lib/jobs";
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
  //
  // The Dashboard redesign's new cards (Top customers, Customer insights,
  // Total inventory value, Most popular strings, Revenue trend) broke that
  // rule the first time around — bolted directly onto THIS Promise.all,
  // they pushed a single dashboard load from ~25-30 DB round trips to
  // ~40-50, which started dropping connections in production (the pooler
  // math above was tuned for the smaller number). Fixed by moving them out
  // of this request entirely: RevenueTrendSection/CustomersInventorySection
  // below are their own async Server Components, each wrapped in its own
  // <Suspense>, so Next streams this page's response as soon as THIS
  // Promise.all resolves and fetches the new cards' data in separate
  // requests afterwards — same principle as the existing link-out cards
  // (don't make the critical path wait on every analytics figure), just
  // implemented with streaming instead of a link out, since these needed
  // to render inline.
  const [lowStockStrings, lowStockRetail, recentMovements, salesStats, recentSales, summary, recentExpenses, salesSplit, stringJobCount, readyForCollection, recentJobs, activeJobCount] = await Promise.all([
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
      revenueTrendSlot={
        <Suspense fallback={<SectionSkeleton label="Revenue trend" height={262} />}>
          <RevenueTrendSection />
        </Suspense>
      }
      customersInventorySlot={
        <Suspense fallback={<SectionSkeleton label="Customers & inventory" height={420} />}>
          <CustomersInventorySection filters={filters} />
        </Suspense>
      }
      initialFrom={dateFrom ? dateFrom.toISOString() : ""}
      initialTo={dateTo ? dateTo.toISOString() : ""}
    />
  );
}
