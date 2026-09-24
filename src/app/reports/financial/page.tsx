import { getFinancialSummary, getPeriodComparison, getMonthlyTrend, getExpenseBreakdown, getSalesSplit } from "@/lib/financials";
import { getExpensesByMonth, getRecurringVsOneOff } from "@/lib/reports-expenses";
import { resolveDateParams } from "@/lib/date-filter";
import { FinancialReportsView } from "@/components/reports/financial-reports-view";

export const dynamic = "force-dynamic";

export default async function FinancialReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const { dateFrom, dateTo } = resolveDateParams(sp);
  const filters = { dateFrom, dateTo };

  const [summary, comparison, monthlyTrend, expenseBreakdown, salesSplit, expensesByMonth, recurringVsOneOff] = await Promise.all([
    getFinancialSummary(filters),
    getPeriodComparison(filters),
    getMonthlyTrend(12),
    getExpenseBreakdown(filters),
    getSalesSplit(filters),
    getExpensesByMonth(12),
    getRecurringVsOneOff(dateFrom?.toISOString().slice(0, 10) ?? null, dateTo?.toISOString().slice(0, 10) ?? null),
  ]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Financial reports</h2>
      <FinancialReportsView
        summary={summary}
        comparison={comparison}
        monthlyTrend={monthlyTrend}
        expenseBreakdown={expenseBreakdown}
        salesSplit={salesSplit}
        expensesByMonth={expensesByMonth}
        recurringVsOneOff={recurringVsOneOff}
        initialFrom={sp.from ?? ""}
        initialTo={sp.to ?? ""}
      />
    </div>
  );
}
