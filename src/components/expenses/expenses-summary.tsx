import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { formatCents } from "@/lib/format";
import type { ExpenseSummary } from "@/lib/expenses";

/** Scoped to whatever date/search/category/status filters are currently
 * applied. operatingTotalCents already excludes voided expenses and never
 * includes inventory purchases (those never enter this table at all —
 * see the file comment in expenses.ts) or capital/equipment purchases
 * (shown here for visibility, kept separate). */
export function ExpensesSummary({ summary }: { summary: ExpenseSummary }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      <Card>
        <StatBlock label="Operating expenses" value={formatCents(summary.operatingTotalCents)} icon="banknote" />
      </Card>
      <Card>
        <StatBlock label="Number of expenses" value={summary.operatingCount} icon="receipt" />
      </Card>
      {summary.capitalTotalCents !== 0 ? (
        <Card>
          <StatBlock label="Capital / equipment" value={formatCents(summary.capitalTotalCents)} icon="package" />
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-s)", color: "var(--text-muted)", marginTop: 8 }}>Not included in Net Profit this phase</div>
        </Card>
      ) : null}
    </div>
  );
}
