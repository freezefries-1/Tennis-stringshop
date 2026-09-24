"use client";

import Link from "next/link";
import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { Tabs } from "@/components/ds/tabs";
import { useState } from "react";
import { formatCents, formatCentsSigned } from "@/lib/format";
import { DateRangePicker } from "./date-range-picker";
import { ExportCsvButton } from "./export-csv-button";
import { exportMonthlyTrendCsvAction, exportExpenseAnalysisCsvAction } from "@/app/reports/actions";
import type { FinancialSummary, ExpenseBreakdown, SalesSplit, MonthlyTrendRow, PeriodComparison } from "@/lib/financials";
import type { ExpensesByMonthRow, RecurringVsOneOffRow } from "@/lib/reports-expenses";

function pctLabel(pct: number | null): string {
  return pct === null ? "—" : `${pct.toFixed(1)}%`;
}

function ComparisonCard({ label, current, previous, changeCents, changePct }: { label: string; current: number; previous: number; changeCents: number; changePct: number | null }) {
  const tone = changeCents > 0 ? "up" : changeCents < 0 ? "down" : "neutral";
  return (
    <Card>
      <StatBlock
        label={label}
        value={formatCentsSigned(current)}
        delta={changePct === null ? undefined : `${changeCents >= 0 ? "+" : ""}${formatCents(changeCents)} / ${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`}
        deltaTone={tone}
      />
      <div className="row-s num" style={{ marginTop: 8 }}>
        Previous period {formatCentsSigned(previous)}
      </div>
    </Card>
  );
}

export function FinancialReportsView({
  summary,
  comparison,
  monthlyTrend,
  expenseBreakdown,
  salesSplit,
  expensesByMonth,
  recurringVsOneOff,
  initialFrom,
  initialTo,
}: {
  summary: FinancialSummary;
  comparison: PeriodComparison;
  monthlyTrend: MonthlyTrendRow[];
  expenseBreakdown: ExpenseBreakdown;
  salesSplit: SalesSplit;
  expensesByMonth: ExpensesByMonthRow[];
  recurringVsOneOff: RecurringVsOneOffRow[];
  initialFrom: string;
  initialTo: string;
}) {
  const [tab, setTab] = useState("performance");
  const recurring = recurringVsOneOff.find((r) => r.kind === "recurring");
  const oneOff = recurringVsOneOff.find((r) => r.kind === "one_off");

  return (
    <div className="rec-wrap">
      <DateRangePicker basePath="/reports/financial" initialFrom={initialFrom} initialTo={initialTo} />
      <Tabs
        items={[
          { value: "performance", label: "Performance" },
          { value: "comparison", label: "Period comparison" },
          { value: "monthly", label: "Monthly (12mo)" },
          { value: "expenses", label: "Expenses" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "performance" ? (
        <>
          <Card padding="20px">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
              <StatBlock label="Net sales revenue" value={formatCents(summary.netSalesRevenueCents)} icon="banknote" />
              <StatBlock label="COGS" value={formatCents(summary.cogsCents)} icon="package" />
              <StatBlock label="Gross profit" value={formatCentsSigned(summary.grossProfitCents)} unit={pctLabel(summary.grossMarginPct)} icon="bar-chart-3" />
              <StatBlock label="Operating expenses" value={formatCents(summary.operatingExpensesCents)} icon="receipt" />
              <StatBlock label="Other income" value={formatCents(summary.otherIncomeCents)} icon="wallet" />
              <StatBlock label="Net profit" value={<span style={{ color: summary.netProfitCents < 0 ? "var(--signal-danger)" : undefined }}>{formatCentsSigned(summary.netProfitCents)}</span>} unit={pctLabel(summary.netMarginPct)} icon="trending-up" />
            </div>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Card>
              <StatBlock label="Payments received (cash)" value={formatCents(summary.paymentsReceivedCents)} icon="wallet" />
            </Card>
            <Card>
              <StatBlock label="Outstanding (receivable)" value={formatCents(summary.outstandingCents)} icon="alert-circle" />
            </Card>
            <Card>
              <StatBlock label="Capital / equipment purchases" value={formatCents(summary.capitalExpensesCents)} icon="package" />
            </Card>
          </div>

          {summary.pctRevenueWithKnownCogs !== null && summary.pctRevenueWithKnownCogs < 100 ? (
            <Card padding="14px 18px" tone="sunken">
              <div className="row-s">
                {summary.pctRevenueWithKnownCogs.toFixed(1)}% of revenue has a known COGS. {formatCents(summary.revenueWithUnknownCogsCents)} comes from custom lines with no recorded cost — treated as $0 COGS, which may overstate Gross Profit. See{" "}
                <Link href="/reports/data-quality" style={{ color: "var(--court-600)" }}>
                  Data quality
                </Link>
                .
              </div>
            </Card>
          ) : null}

          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              Gross profit by business area
            </div>
            <div className="row-s" style={{ marginBottom: 10 }}>
              Revenue and COGS only — operating expenses aren&rsquo;t allocated per area, so this is Gross Profit, not Net Profit by area.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th></th>
                    <th className="num">Revenue</th>
                    <th className="num">COGS</th>
                    <th className="num">Gross profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Stringing / services</td>
                    <td className="num">{formatCents(salesSplit.stringing.revenueCents)}</td>
                    <td className="num">{formatCents(salesSplit.stringing.cogsCents)}</td>
                    <td className="num">{formatCentsSigned(salesSplit.stringing.grossProfitCents)}</td>
                  </tr>
                  <tr>
                    <td>Retail</td>
                    <td className="num">{formatCents(salesSplit.retail.revenueCents)}</td>
                    <td className="num">{formatCents(salesSplit.retail.cogsCents)}</td>
                    <td className="num">{formatCentsSigned(salesSplit.retail.grossProfitCents)}</td>
                  </tr>
                  {salesSplit.other.revenueCents !== 0 ? (
                    <tr>
                      <td>Other / custom</td>
                      <td className="num">{formatCents(salesSplit.other.revenueCents)}</td>
                      <td className="num">{formatCents(salesSplit.other.cogsCents)}</td>
                      <td className="num">{formatCentsSigned(salesSplit.other.grossProfitCents)}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}

      {tab === "comparison" ? (
        comparison.hasPrevious ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            <ComparisonCard label="Revenue" {...comparison.revenue} />
            <ComparisonCard label="COGS" {...comparison.cogs} />
            <ComparisonCard label="Gross profit" {...comparison.grossProfit} />
            <ComparisonCard label="Operating expenses" {...comparison.operatingExpenses} />
            <ComparisonCard label="Net profit" {...comparison.netProfit} />
          </div>
        ) : (
          <Card>
            <div className="row-s">All time has no previous period to compare against — pick a specific range (This month, This quarter, ...) to see a comparison.</div>
          </Card>
        )
      ) : null}

      {tab === "monthly" ? (
        <Card padding="18px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div className="lab">Last 12 months</div>
            <ExportCsvButton filename={`monthly-financial-performance-${new Date().toISOString().slice(0, 10)}.csv`} fetchCsv={() => exportMonthlyTrendCsvAction(12)} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="num">Revenue</th>
                  <th className="num">COGS</th>
                  <th className="num">Gross profit</th>
                  <th className="num">Gross margin</th>
                  <th className="num">Expenses</th>
                  <th className="num">Net profit</th>
                  <th className="num">Net margin</th>
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map((m) => {
                  const grossMarginPct = m.netSalesRevenueCents !== 0 ? (m.grossProfitCents / m.netSalesRevenueCents) * 100 : null;
                  const netMarginPct = m.netSalesRevenueCents !== 0 ? (m.netProfitCents / m.netSalesRevenueCents) * 100 : null;
                  return (
                    <tr key={m.label}>
                      <td>{m.label}</td>
                      <td className="num">{formatCents(m.netSalesRevenueCents)}</td>
                      <td className="num">{formatCents(m.cogsCents)}</td>
                      <td className="num">{formatCentsSigned(m.grossProfitCents)}</td>
                      <td className="num">{pctLabel(grossMarginPct)}</td>
                      <td className="num">{formatCents(m.operatingExpensesCents)}</td>
                      <td className="num">{formatCentsSigned(m.netProfitCents)}</td>
                      <td className="num">{pctLabel(netMarginPct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === "expenses" ? (
        <>
          <Card padding="18px">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
              <div className="lab">Operating expenses by category (selected period)</div>
              <ExportCsvButton
                filename={`expense-analysis-${new Date().toISOString().slice(0, 10)}.csv`}
                fetchCsv={() => exportExpenseAnalysisCsvAction({ dateFrom: initialFrom ? initialFrom.slice(0, 10) : null, dateTo: initialTo ? initialTo.slice(0, 10) : null })}
              />
            </div>
            {expenseBreakdown.byCategory.length === 0 ? (
              <div className="row-s">No operating expenses in this period.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="num">Amount</th>
                      <th className="num">% of total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseBreakdown.byCategory.map((c) => (
                      <tr key={c.categoryId}>
                        <td>{c.categoryName}</td>
                        <td className="num">{formatCents(c.amountCents)}</td>
                        <td className="num">{c.percentOfTotal.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Card>
              <StatBlock label="Recurring expenses" value={formatCents(recurring?.totalCents ?? 0)} unit={`${recurring?.count ?? 0} entries`} icon="rotate-ccw" />
            </Card>
            <Card>
              <StatBlock label="One-off expenses" value={formatCents(oneOff?.totalCents ?? 0)} unit={`${oneOff?.count ?? 0} entries`} icon="receipt" />
            </Card>
          </div>

          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              Expenses by month (last 12 months, operating vs capital)
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="num">Operating</th>
                    <th className="num">Capital</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesByMonth.map((m) => (
                    <tr key={m.label}>
                      <td>{m.label}</td>
                      <td className="num">{formatCents(m.operatingCents)}</td>
                      <td className="num">{formatCents(m.capitalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
