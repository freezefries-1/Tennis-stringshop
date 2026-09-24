"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { formatCents, formatDate } from "@/lib/format";
import { DateRangePicker } from "./date-range-picker";
import { ExportCsvButton } from "./export-csv-button";
import { exportCustomerPerformanceCsvAction } from "@/app/reports/actions";
import type { CustomerAnalyticsSummary, CustomerPerformanceRow } from "@/lib/reports-customers";

type SortKey = "spend" | "sales" | "jobs" | "avg";

function sortRows(rows: CustomerPerformanceRow[], key: SortKey): CustomerPerformanceRow[] {
  const sorted = [...rows];
  if (key === "spend") sorted.sort((a, b) => b.totalSalesCents - a.totalSalesCents);
  else if (key === "sales") sorted.sort((a, b) => b.numberOfSales - a.numberOfSales);
  else if (key === "jobs") sorted.sort((a, b) => b.stringJobsInPeriod - a.stringJobsInPeriod);
  else if (key === "avg") sorted.sort((a, b) => (b.avgSaleValueCents ?? 0) - (a.avgSaleValueCents ?? 0));
  return sorted;
}

function selectStyle(): React.CSSProperties {
  return { height: 34, padding: "0 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 13 };
}

export function CustomerReportsView({ summary, performance, initialFrom, initialTo }: { summary: CustomerAnalyticsSummary; performance: CustomerPerformanceRow[]; initialFrom: string; initialTo: string }) {
  const [sortKey, setSortKey] = useState<SortKey>("spend");

  return (
    <div className="rec-wrap">
      <DateRangePicker basePath="/reports/customers" initialFrom={initialFrom} initialTo={initialTo} />

      <Card padding="20px">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <StatBlock label="Total customers" value={summary.totalCustomers} icon="users" />
          <StatBlock label="New this period" value={summary.newCustomers ?? "—"} icon="users" />
          <StatBlock label="Returning this period" value={summary.returningCustomers ?? "—"} icon="users" />
          <StatBlock label="With purchases" value={summary.customersWithPurchases} icon="banknote" />
          <StatBlock label="With string jobs" value={summary.customersWithStringJobs} icon="wrench" />
          <StatBlock label="Avg spend / customer" value={summary.avgCustomerSpendCents === null ? "—" : formatCents(summary.avgCustomerSpendCents)} icon="banknote" />
          <StatBlock label="Avg transactions / customer" value={summary.avgTransactionsPerCustomer === null ? "—" : summary.avgTransactionsPerCustomer.toFixed(1)} icon="bar-chart-3" />
        </div>
        {summary.newCustomers === null ? (
          <div className="row-s" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            New vs returning needs a specific period selected — pick a range other than All time to see the split. New = first-ever purchase or completed job fell in this period. Returning = active before this period, and again during it.
          </div>
        ) : null}
      </Card>

      <Card padding="18px">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div className="lab">Customer performance (this period)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={selectStyle()}>
              <option value="spend">Sort: Total spend</option>
              <option value="sales">Sort: Number of sales</option>
              <option value="jobs">Sort: String jobs</option>
              <option value="avg">Sort: Average sale value</option>
            </select>
            <ExportCsvButton
              filename={`customer-performance-${new Date().toISOString().slice(0, 10)}.csv`}
              fetchCsv={() => exportCustomerPerformanceCsvAction({ dateFrom: initialFrom ? new Date(initialFrom) : null, dateTo: initialTo ? new Date(initialTo) : null })}
            />
          </div>
        </div>
        {performance.length === 0 ? (
          <div className="row-s">No customer activity in this period.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className="num">Total sales</th>
                  <th className="num"># sales</th>
                  <th className="num">String jobs</th>
                  <th className="num">Avg sale value</th>
                  <th className="num">Last purchase</th>
                  <th className="num">Last string job</th>
                </tr>
              </thead>
              <tbody>
                {sortRows(performance, sortKey).map((r) => (
                  <tr key={r.customerId}>
                    <td>
                      <Link href={`/customers/${r.customerId}`} style={{ color: "var(--court-600)" }}>
                        {r.code} · {r.name}
                      </Link>
                    </td>
                    <td className="num">{formatCents(r.totalSalesCents)}</td>
                    <td className="num">{r.numberOfSales}</td>
                    <td className="num">{r.stringJobsInPeriod}</td>
                    <td className="num">{r.avgSaleValueCents === null ? "—" : formatCents(r.avgSaleValueCents)}</td>
                    <td className="num">{formatDate(r.lastPurchase)}</td>
                    <td className="num">{formatDate(r.lastStringJob)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
