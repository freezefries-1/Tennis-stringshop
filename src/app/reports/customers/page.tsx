import { getCustomerAnalyticsSummary, listCustomerPerformance } from "@/lib/reports-customers";
import { resolveDateParams } from "@/lib/date-filter";
import { CustomerReportsView } from "@/components/reports/customer-reports-view";

export const dynamic = "force-dynamic";

export default async function CustomerReportsPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const sp = await searchParams;
  const filters = resolveDateParams(sp);

  const [summary, performance] = await Promise.all([getCustomerAnalyticsSummary(filters), listCustomerPerformance(filters)]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Customer reports</h2>
      <CustomerReportsView summary={summary} performance={performance} initialFrom={sp.from ?? ""} initialTo={sp.to ?? ""} />
    </div>
  );
}
