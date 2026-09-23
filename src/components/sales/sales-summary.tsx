import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { formatCents } from "@/lib/format";
import type { SalesSummary as SalesSummaryData } from "@/lib/sales";

/** The 5 numbers requested for the Sales list — scoped to whatever
 * date/search/status/payment filters are currently applied (brief), always
 * net of returns/refunds and never counting a cancelled Sale (see
 * getSalesSummary's own comment for the exact accounting rules). */
export function SalesSummary({ summary }: { summary: SalesSummaryData }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
      <Card>
        <StatBlock label="Number of sales" value={summary.saleCount} icon="receipt" />
      </Card>
      <Card>
        <StatBlock label="Net sales revenue" value={formatCents(summary.netRevenueCents)} icon="banknote" />
      </Card>
      <Card>
        <StatBlock label="COGS" value={formatCents(summary.cogsCents)} icon="package" />
      </Card>
      <Card>
        <StatBlock label="Gross profit" value={formatCents(summary.grossProfitCents)} icon="bar-chart-3" />
      </Card>
      <Card>
        <StatBlock label="Unpaid amount" value={formatCents(summary.unpaidCents)} icon="alert-circle" />
      </Card>
    </div>
  );
}
