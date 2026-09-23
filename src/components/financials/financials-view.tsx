"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { StatBlock } from "@/components/ds/stat-block";
import { Icon } from "@/components/ds/icon";
import { formatCents, formatCentsSigned, formatDate } from "@/lib/format";
import { DATE_FILTER_LABEL, presetRange, detectPreset, toLocalDateInputValue, type DateFilterPreset } from "@/lib/date-filter";
import type { FinancialSummary, ExpenseBreakdown, SalesSplit, MonthlyFinancials } from "@/lib/financials";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

function pctLabel(pct: number | null): string {
  return pct === null ? "—" : `${pct.toFixed(1)}%`;
}

/** Detects whether [fromISO, toISO) is exactly one calendar month wide, in
 * the browser's local time — true for "This month"/"Last month" and for
 * any month reached via the prev/next arrows below, so the same UI state
 * doubles as both a preset and an arbitrarily-navigable month browser. */
function singleCalendarMonth(fromISO: string, toISO: string): { year: number; month: number } | null {
  if (!fromISO || !toISO) return null;
  const from = new Date(fromISO);
  const to = new Date(toISO);
  if (from.getDate() !== 1 || from.getHours() !== 0) return null;
  const expectedNext = new Date(from.getFullYear(), from.getMonth() + 1, 1);
  if (to.getTime() !== expectedNext.getTime()) return null;
  return { year: from.getFullYear(), month: from.getMonth() + 1 };
}

export function FinancialsView({
  summary,
  expenseBreakdown,
  salesSplit,
  monthlyTrend,
  initialFrom,
  initialTo,
}: {
  summary: FinancialSummary;
  expenseBreakdown: ExpenseBreakdown;
  salesSplit: SalesSplit;
  monthlyTrend: MonthlyFinancials[];
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const dateFilter = detectPreset(initialFrom, initialTo);
  const [customFrom, setCustomFrom] = useState(() => (dateFilter === "custom" && initialFrom ? toLocalDateInputValue(new Date(initialFrom)) : ""));
  const [customTo, setCustomTo] = useState(() => {
    if (dateFilter !== "custom" || !initialTo) return "";
    const end = new Date(initialTo);
    end.setDate(end.getDate() - 1);
    return toLocalDateInputValue(end);
  });

  function pushRange(from: Date | null, to: Date | null) {
    const params = new URLSearchParams();
    if (from) params.set("from", from.toISOString());
    if (to) params.set("to", to.toISOString());
    router.push(`/financials?${params.toString()}`);
  }

  function pushPreset(preset: DateFilterPreset, from = customFrom, to = customTo) {
    const [start, end] = presetRange(preset, from, to);
    pushRange(start, end);
  }

  const month = singleCalendarMonth(initialFrom, initialTo);

  function navigateMonth(delta: number) {
    if (!month) return;
    const start = new Date(month.year, month.month - 1 + delta, 1);
    const end = new Date(month.year, month.month + delta, 1);
    pushRange(start, end);
  }

  const drillParams = new URLSearchParams();
  if (initialFrom) drillParams.set("from", initialFrom);
  if (initialTo) drillParams.set("to", initialTo);
  const drillQuery = drillParams.toString();

  return (
    <div className="rec-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        {month ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={() => navigateMonth(-1)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-500)", display: "flex" }} aria-label="Previous month">
              <Icon name="chevron-left" size={18} />
            </button>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18, minWidth: 160, textAlign: "center" }}>
              {MONTH_NAMES[month.month - 1]} {month.year}
            </span>
            <button type="button" onClick={() => navigateMonth(1)} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--ink-500)", display: "flex" }} aria-label="Next month">
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
        ) : (
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 18 }}>{DATE_FILTER_LABEL[dateFilter]}</span>
        )}

        <select value={dateFilter} onChange={(e) => pushPreset(e.target.value as DateFilterPreset)} style={selectStyle()}>
          {(Object.keys(DATE_FILTER_LABEL) as DateFilterPreset[]).map((f) => (
            <option key={f} value={f}>
              {DATE_FILTER_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      {dateFilter === "custom" ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="From" style={{ width: 160, minWidth: 0 }}>
            <Input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); pushPreset("custom", e.target.value, customTo); }} style={{ width: "100%", minWidth: 0 }} />
          </Field>
          <Field label="To" style={{ width: 160, minWidth: 0 }}>
            <Input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); pushPreset("custom", customFrom, e.target.value); }} style={{ width: "100%", minWidth: 0 }} />
          </Field>
        </div>
      ) : null}

      <Card padding="20px">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
          <StatBlock label="Net sales revenue" value={formatCents(summary.netSalesRevenueCents)} icon="banknote" />
          <StatBlock label="COGS" value={formatCents(summary.cogsCents)} icon="package" />
          <StatBlock label="Gross profit" value={formatCentsSigned(summary.grossProfitCents)} icon="bar-chart-3" unit={pctLabel(summary.grossMarginPct)} />
          <StatBlock label="Operating expenses" value={formatCents(summary.operatingExpensesCents)} icon="receipt" />
          <StatBlock label="Other income" value={formatCents(summary.otherIncomeCents)} icon="wallet" />
          <StatBlock
            label="Net profit"
            value={<span style={{ color: summary.netProfitCents < 0 ? "var(--signal-danger)" : undefined }}>{formatCentsSigned(summary.netProfitCents)}</span>}
            unit={pctLabel(summary.netMarginPct)}
            icon="trending-up"
          />
        </div>
        {summary.otherIncomeCents !== 0 ? (
          <div className="row-s" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            Net profit = Gross profit − Operating expenses + Other income. Other income (
            <Link href={`/other-income?${drillQuery}`} style={{ color: "var(--court-600)" }}>
              {formatCents(summary.otherIncomeCents)} this period
            </Link>
            ) is money in that isn&rsquo;t Sales revenue — e.g. selling old equipment — kept separate so it&rsquo;s never confused with Sales.
          </div>
        ) : null}
        {summary.capitalExpensesCents > 0 ? (
          <div className="row-s" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            Capital / equipment purchases in this period: <strong>{formatCents(summary.capitalExpensesCents)}</strong>. Shown for visibility only — not subtracted from Net Profit (no depreciation schedule yet).
          </div>
        ) : null}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Card>
          <StatBlock label="Sales revenue (accrual)" value={formatCents(summary.netSalesRevenueCents)} icon="banknote" />
        </Card>
        <Card>
          <StatBlock label="Payments received (cash)" value={formatCents(summary.paymentsReceivedCents)} icon="wallet" />
        </Card>
        <Card>
          <StatBlock label="Outstanding (accounts receivable)" value={formatCents(summary.outstandingCents)} icon="alert-circle" />
        </Card>
      </div>

      {summary.pctRevenueWithKnownCogs !== null && summary.pctRevenueWithKnownCogs < 100 ? (
        <Card padding="14px 18px" tone="sunken">
          <div className="row-s">
            {summary.pctRevenueWithKnownCogs.toFixed(1)}% of this period&rsquo;s sales revenue has a known COGS. {formatCents(summary.revenueWithUnknownCogsCents)} of revenue comes from custom line items with no recorded cost — treated as $0 COGS, which may overstate Gross Profit.
          </div>
        </Card>
      ) : null}

      <Card padding="18px">
        <div className="lab" style={{ marginBottom: 12 }}>
          Stringing vs retail
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
                <td>Stringing</td>
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
        {salesSplit.saleLevelDiscountCents !== 0 ? (
          <div className="row-s" style={{ marginTop: 10 }}>
            Less sale-level discounts: {formatCents(salesSplit.saleLevelDiscountCents)} (not attributable to one bucket) — buckets above minus this equal Net sales revenue.
          </div>
        ) : null}
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        <Card padding="18px">
          <div className="lab" style={{ marginBottom: 12 }}>
            Operating expenses by category
          </div>
          {expenseBreakdown.byCategory.length === 0 ? (
            <div className="row-s">No operating expenses in this period.</div>
          ) : (
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
                    <td>
                      <Link href={`/expenses?categoryId=${c.categoryId}&${drillQuery}`} style={{ color: "var(--court-600)" }}>
                        {c.categoryName}
                      </Link>
                    </td>
                    <td className="num">{formatCents(c.amountCents)}</td>
                    <td className="num">{c.percentOfTotal.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card padding="18px">
        <div className="lab" style={{ marginBottom: 12 }}>
          Monthly trend
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th>Month</th>
                <th className="num">Revenue</th>
                <th className="num">Gross profit</th>
                <th className="num">Expenses</th>
                <th className="num">Net profit</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((m) => {
                const [s, e] = [new Date(m.year, m.month - 1, 1), new Date(m.year, m.month, 1)];
                return (
                  <tr key={m.label} onClick={() => pushRange(s, e)} tabIndex={0} onKeyDown={(ev) => ev.key === "Enter" && pushRange(s, e)}>
                    <td>{m.label}</td>
                    <td className="num">{formatCents(m.netSalesRevenueCents)}</td>
                    <td className="num">{formatCentsSigned(m.grossProfitCents)}</td>
                    <td className="num">{formatCents(m.operatingExpensesCents)}</td>
                    <td className="num">{formatCentsSigned(m.netProfitCents)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href={`/sales?${drillQuery}`}>
          <Button size="sm" variant="secondary">
            View sales in this period
          </Button>
        </Link>
        <Link href={`/expenses?${drillQuery}`}>
          <Button size="sm" variant="secondary">
            View expenses in this period
          </Button>
        </Link>
        <Link href={`/other-income?${drillQuery}`}>
          <Button size="sm" variant="secondary">
            View other income in this period
          </Button>
        </Link>
      </div>
      <div className="row-s">As of {formatDate(new Date())}. Figures are computed live from Sales and Expenses records — nothing here is stored separately.</div>
    </div>
  );
}
