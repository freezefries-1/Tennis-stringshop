import { getFinancialSummary, getExpenseBreakdown, getSalesSplit, getMonthlyTrend } from "@/lib/financials";
import { FinancialsView } from "@/components/financials/financials-view";

export const dynamic = "force-dynamic";

interface FinancialsSearchParams {
  from?: string;
  to?: string;
}

/** This month, by the server's own clock — used only when the URL carries
 * no range yet (the very first visit). Once the user picks anything, the
 * client resolves every range in local time and pushes exact ISO bounds
 * into the URL, same as Sales/Expenses. */
function defaultMonthRange(): [Date, Date] {
  const now = new Date();
  return [new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 1)];
}

export default async function FinancialsPage({ searchParams }: { searchParams: Promise<FinancialsSearchParams> }) {
  const sp = await searchParams;
  let dateFrom: Date | null;
  let dateTo: Date | null;
  if (sp.from || sp.to) {
    dateFrom = sp.from ? new Date(sp.from) : null;
    dateTo = sp.to ? new Date(sp.to) : null;
  } else {
    [dateFrom, dateTo] = defaultMonthRange();
  }

  const filters = { dateFrom, dateTo };
  const [summary, expenseBreakdown, salesSplit, monthlyTrend] = await Promise.all([getFinancialSummary(filters), getExpenseBreakdown(filters), getSalesSplit(filters), getMonthlyTrend(6)]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Financials</h2>
      <FinancialsView summary={summary} expenseBreakdown={expenseBreakdown} salesSplit={salesSplit} monthlyTrend={monthlyTrend} initialFrom={dateFrom ? dateFrom.toISOString() : ""} initialTo={dateTo ? dateTo.toISOString() : ""} />
    </div>
  );
}
