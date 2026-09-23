import { getFinancialSummary, getExpenseBreakdown, getSalesSplit, getMonthlyTrend } from "@/lib/financials";
import { FinancialsView } from "@/components/financials/financials-view";

export const dynamic = "force-dynamic";

interface FinancialsSearchParams {
  from?: string;
  to?: string;
}

export default async function FinancialsPage({ searchParams }: { searchParams: Promise<FinancialsSearchParams> }) {
  const sp = await searchParams;
  // All time is the default/primary view (no from/to in the URL yet) — the
  // Overall Profit figure this page centres on is explicitly meant to be
  // checked over All time/a full year, not a single month (see its own
  // explanation in FinancialsView). Every other range is still one click
  // away via the preset dropdown, which lists "All time" first.
  const dateFrom = sp.from ? new Date(sp.from) : null;
  const dateTo = sp.to ? new Date(sp.to) : null;

  const filters = { dateFrom, dateTo };
  const [summary, expenseBreakdown, salesSplit, monthlyTrend] = await Promise.all([getFinancialSummary(filters), getExpenseBreakdown(filters), getSalesSplit(filters), getMonthlyTrend(6)]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Financials</h2>
      <FinancialsView summary={summary} expenseBreakdown={expenseBreakdown} salesSplit={salesSplit} monthlyTrend={monthlyTrend} initialFrom={dateFrom ? dateFrom.toISOString() : ""} initialTo={dateTo ? dateTo.toISOString() : ""} />
    </div>
  );
}
