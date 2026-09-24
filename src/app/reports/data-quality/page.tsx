import Link from "next/link";
import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { getDataQualityReport } from "@/lib/reports-data-quality";
import { formatCents, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DataQualityPage() {
  const report = await getDataQualityReport();

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Data quality</h2>
      <div className="rec-wrap">
        <Card padding="14px 18px" tone="sunken">
          <div className="row-s">
            For review, not alarm — these are facts about incomplete or unusual records, kept off the main Dashboard on purpose (Phase 8 §40).
          </div>
        </Card>

        <Card padding="20px">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <StatBlock label="Sales with unknown COGS" value={report.unknownCogsSaleCount} icon="alert-circle" />
            <StatBlock label="Revenue with unknown COGS" value={formatCents(report.unknownCogsRevenueCents)} icon="alert-circle" />
            <StatBlock label="String products missing cost" value={report.stringProductsMissingCost.length} icon="layers" />
            <StatBlock label="Jobs missing linked Sale" value={report.jobsMissingLinkedSale.length} icon="wrench" />
            <StatBlock label="Negative string batches" value={report.negativeStringBatches.length} icon="alert-circle" />
            <StatBlock label="Negative product batches" value={report.negativeProductBatches.length} icon="alert-circle" />
          </div>
        </Card>

        {report.unknownCogsSaleCount > 0 ? (
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 8 }}>
              Unknown COGS
            </div>
            <div className="row-s">
              {report.unknownCogsSaleCount} sale{report.unknownCogsSaleCount === 1 ? "" : "s"} include a custom line item with no recorded cost — treated as $0 COGS, which may overstate Gross Profit by up to {formatCents(report.unknownCogsRevenueCents)}. See{" "}
              <Link href="/sales" style={{ color: "var(--court-600)" }}>
                Sales
              </Link>{" "}
              (search for &ldquo;custom&rdquo; line items) to add real costs where known.
            </div>
          </Card>
        ) : null}

        {report.stringProductsMissingCost.length > 0 ? (
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 8 }}>
              String products missing cost (never received)
            </div>
            {report.stringProductsMissingCost.map((s) => (
              <div key={s.id} className="row-s">
                <Link href={`/inventory/products/${s.id}`} style={{ color: "var(--court-600)" }}>
                  {s.label}
                </Link>
              </div>
            ))}
          </Card>
        ) : null}

        {report.jobsMissingLinkedSale.length > 0 ? (
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 8 }}>
              Completed jobs with no linked Sale
            </div>
            <div className="row-s" style={{ marginBottom: 10 }}>
              Expected for jobs completed before Phase 6 shipped — flagged for visibility, not necessarily a problem.
            </div>
            {report.jobsMissingLinkedSale.map((j) => (
              <div key={j.id} className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                <Link href={`/jobs/${j.id}`} style={{ color: "var(--court-600)" }}>
                  {j.code}
                </Link>
                <span className="num">{j.completedAt ? formatDate(j.completedAt) : "—"}</span>
              </div>
            ))}
          </Card>
        ) : null}

        {report.negativeStringBatches.length > 0 || report.negativeProductBatches.length > 0 ? (
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 8 }}>
              Negative stock (stock override was used)
            </div>
            {report.negativeStringBatches.map((b) => (
              <div key={b.id} className="row-s">
                String batch {b.batchNumber}: {b.remainingQuantity}
              </div>
            ))}
            {report.negativeProductBatches.map((b) => (
              <div key={b.id} className="row-s">
                Product batch {b.batchNumber}: {b.remainingQuantity}
              </div>
            ))}
          </Card>
        ) : null}

        {report.unknownCogsSaleCount === 0 && report.stringProductsMissingCost.length === 0 && report.jobsMissingLinkedSale.length === 0 && report.negativeStringBatches.length === 0 && report.negativeProductBatches.length === 0 ? (
          <Card padding="18px">
            <div className="row-s">No data quality issues found.</div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
