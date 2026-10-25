"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { Icon } from "@/components/ds/icon";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { StatBlock } from "@/components/ds/stat-block";
import { DateRangePicker } from "@/components/reports/date-range-picker";
import { formatMoney0, formatCents, formatCentsSigned, formatDate, formatDateWithWeekday } from "@/lib/format";
import type { RecentMovementRow } from "@/lib/string-inventory";
import type { DashboardSalesStats, RecentSaleRow } from "@/lib/sales";
import type { FinancialSummary, SalesSplit, PeriodComparison, MonthlyTrendRow } from "@/lib/financials";
import type { ExpenseListRow } from "@/lib/expenses";
import type { ReadyForCollectionRow, RecentJobRow } from "@/lib/jobs";
import type { TopCustomerRow, CustomerAnalyticsSummary } from "@/lib/reports-customers";
import type { InventoryValueOverview } from "@/lib/reports-inventory";
import type { PopularStringRow } from "@/lib/reports-stringing";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobs/job-status";

function PanelHead({ label, title, action }: { label: string; title?: string; action?: ReactNode }) {
  return (
    <div className="ph">
      <div>
        <div className="lab">{label}</div>
        {title ? <div className="ph-t">{title}</div> : null}
      </div>
      {action ?? null}
    </div>
  );
}

/** Real Sales/Expenses figures (Phase 7) — no separate month/year tables,
 * this is the same getFinancialSummary() Financials page uses, just scoped
 * to whatever range the dashboard page passed in. Phase 8 adds Outstanding
 * and Other income (§4's minimum card set) and, where a previous period
 * exists, a Net profit delta (§3) — never an independently-recomputed
 * formula, just getPeriodComparison's own figures. */
function PL({ d, label, comparison }: { d: FinancialSummary; label: string; comparison?: PeriodComparison }) {
  const items: SpecListItem[] = [
    { label: "Revenue", value: <span className="num">{formatCents(d.netSalesRevenueCents)}</span> },
    { label: "COGS", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{formatCents(d.cogsCents)}</span> },
    {
      label: "Gross profit",
      value: (
        <span className="num">
          {formatCentsSigned(d.grossProfitCents)} <span className="pct">{d.grossMarginPct === null ? "—" : `${Math.round(d.grossMarginPct)}%`}</span>
        </span>
      ),
    },
    { label: "Expenses", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{formatCents(d.operatingExpensesCents)}</span> },
    { label: "Other income", value: <span className="num">{formatCents(d.otherIncomeCents)}</span> },
    { label: "Outstanding", value: <span className="num">{formatCents(d.outstandingCents)}</span> },
  ];
  const net = comparison?.netProfit;
  return (
    <Card padding="20px 24px 24px">
      <PanelHead label={label} />
      <SpecList dense items={items} />
      <div className="net">
        <span>Net profit</span>
        <span className="num" style={d.netProfitCents < 0 ? { color: "var(--signal-danger)" } : undefined}>
          {formatCentsSigned(d.netProfitCents)}
        </span>
      </div>
      {net && net.changePct !== null ? (
        <div className="row-s num" style={{ marginTop: 8, color: net.changeCents >= 0 ? "var(--signal-success)" : "var(--signal-danger)" }}>
          {net.changeCents >= 0 ? "+" : ""}
          {formatCents(net.changeCents)} / {net.changePct >= 0 ? "+" : ""}
          {net.changePct.toFixed(1)}% vs previous period ({formatCentsSigned(net.previous)})
        </div>
      ) : null}
    </Card>
  );
}

function daysSince(d: Date): string {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days <= 0) return "today";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function ReadyList({ items }: { items: ReadyForCollectionRow[] }) {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label={`Waiting for collection · ${items.length}`}
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/jobs")}>
              All jobs
            </Button>
          }
        />
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          Nothing waiting for collection right now.
        </div>
      ) : (
        <div className="rows">
          {items.map((j) => (
            <div className="row" key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} style={{ cursor: "pointer" }}>
              <div className="row-main">
                <div className="row-t">{j.customerName}</div>
                <div className="row-s num">
                  {j.code} · {j.racketLabel}
                </div>
              </div>
              <div className="row-end">
                <span className="row-s num">Ready {daysSince(j.completedAt)}</span>
                {j.paid ? (
                  <Badge tone="success" dot>
                    Paid
                  </Badge>
                ) : (
                  <Badge tone="warning" dot>
                    Unpaid
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export interface MergedLowStockRow {
  kind: "string" | "product";
  productId: string;
  label: string;
  available: string;
  unit: string;
  threshold: string;
  status: string;
}

function unitSuffix(unit: string): string {
  return unit === "set" ? " sets" : unit === "m" ? "m" : "";
}

function LowStock({ items }: { items: MergedLowStockRow[] }) {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label={`Low stock · ${items.length}`}
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/inventory")}>
              Receive stock
            </Button>
          }
        />
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          Nothing low or out of stock right now.
        </div>
      ) : (
        <div className="rows">
          {items.map((s) => {
            const available = Number(s.available);
            const threshold = Number(s.threshold) || 1;
            const href = s.kind === "string" ? `/inventory/products/${s.productId}` : `/products/${s.productId}`;
            return (
              <div className="row" key={`${s.kind}-${s.productId}`} onClick={() => router.push(href)} style={{ cursor: "pointer" }}>
                <div className="row-main">
                  <div className="row-t">{s.label}</div>
                  <div className="row-s num">
                    reorder at {s.threshold}
                    {unitSuffix(s.unit)}
                  </div>
                </div>
                <div className="row-end" style={{ minWidth: 104 }}>
                  <span className="num" style={{ color: s.status === "out_of_stock" ? "var(--signal-danger)" : "var(--signal-warning)", fontSize: 14 }}>
                    {s.available}
                    {unitSuffix(s.unit)}
                  </span>
                  <ProgressBar value={available} max={threshold} height={4} tone={s.status === "out_of_stock" ? "danger" : "warning"} style={{ width: 96 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function RecentInventoryMovements({ movements }: { movements: RecentMovementRow[] }) {
  const router = useRouter();
  const MOVEMENT_LABEL: Record<string, string> = {
    received: "Stock received",
    string_job: "String Job",
    retail_sale: "Retail Sale",
    manual_add: "Manual addition",
    manual_deduct: "Manual deduction",
    wastage: "Wastage",
    correction: "Correction",
    reversal: "Reversal",
  };
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label="Recent inventory movements"
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/inventory")}>
              All inventory
            </Button>
          }
        />
      </div>
      {movements.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          No stock movements yet.
        </div>
      ) : (
        <div className="rows">
          {movements.map((m) => (
            <div className="row" key={m.id}>
              <div className="row-main">
                <div className="row-t">{m.productLabel}</div>
                <div className="row-s num">
                  {MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                  {m.jobCode ? ` · ${m.jobCode}` : ""}
                </div>
              </div>
              <div className="row-end">
                <span className="row-s num">{formatDate(m.occurredAt)}</span>
                <span className="num" style={{ fontSize: 14.5 }}>
                  {Number(m.quantityChange) > 0 ? "+" : ""}
                  {m.quantityChange}
                  {m.unit === "set" ? " sets" : "m"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentJobs({ jobs }: { jobs: RecentJobRow[] }) {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label="Recent string jobs"
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/jobs")}>
              All jobs
            </Button>
          }
        />
      </div>
      {jobs.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          No string jobs yet.
        </div>
      ) : (
        <div className="rows">
          {jobs.map((j) => (
            <div className="row" key={j.id} onClick={() => router.push(`/jobs/${j.id}`)} style={{ cursor: "pointer" }}>
              <div className="row-main">
                <div className="row-t">{j.racketLabel}</div>
                <div className="row-s num">
                  {j.code} · {j.customerName} · {j.mainString}
                  {j.crossString !== "—" && j.crossString !== j.mainString ? ` / ${j.crossString}` : ""}
                </div>
              </div>
              <div className="row-end">
                <span className="row-s num">{j.dueOn ? formatDate(j.dueOn) : "No due date"}</span>
                <Badge tone={JOB_STATUS_TONE[j.status]} dot>
                  {JOB_STATUS_LABEL[j.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentSales({ sales }: { sales: RecentSaleRow[] }) {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label="Recent sales"
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/sales")}>
              All sales
            </Button>
          }
        />
      </div>
      {sales.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          No sales yet — ring up the first one from POS.
        </div>
      ) : (
        <div className="rows">
          {sales.map((s) => (
            <div className="row" key={s.id} onClick={() => router.push(`/sales/${s.id}`)} style={{ cursor: "pointer" }}>
              <div className="row-main">
                <div className="row-t">{s.customerName ?? "Walk-in"}</div>
                <div className="row-s num">
                  {s.code} · {s.itemSummary || "—"}
                </div>
              </div>
              <div className="row-end">
                <span className="row-s num">{formatDate(s.occurredAt)}</span>
                <span className="num" style={{ fontSize: 14.5, fontWeight: 500 }}>
                  {formatCents(s.totalCents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecentExpenses({ expenses }: { expenses: ExpenseListRow[] }) {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label="Recent expenses"
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/expenses")}>
              All expenses
            </Button>
          }
        />
      </div>
      {expenses.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          No expenses recorded yet.
        </div>
      ) : (
        <div className="rows">
          {expenses.map((e) => (
            <div className="row" key={e.id} onClick={() => router.push(`/expenses/${e.id}`)} style={{ cursor: "pointer" }}>
              <div className="row-main">
                <div className="row-t">{e.description}</div>
                <div className="row-s num">
                  {e.expenseNumber} · {e.categoryName}
                </div>
              </div>
              <div className="row-end">
                <span className="row-s num">{formatDate(e.expenseDate)}</span>
                <span className="num" style={{ fontSize: 14.5, fontWeight: 500 }}>
                  {formatCents(e.amountCents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function RevenueTrend({ rows }: { rows: MonthlyTrendRow[] }) {
  const router = useRouter();
  const max = Math.max(1, ...rows.map((r) => r.netSalesRevenueCents));
  const peak = rows.reduce((p, r) => (r.netSalesRevenueCents > p.netSalesRevenueCents ? r : p), rows[0]);
  return (
    <Card padding="18px">
      <PanelHead
        label="Revenue trend"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {peak ? <span className="row-s num">Peak: {formatMoney0(peak.netSalesRevenueCents / 100)}</span> : null}
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/reports/financial")}>
              Reports
            </Button>
          </div>
        }
      />
      {rows.every((r) => r.netSalesRevenueCents === 0) ? (
        <div className="row-s">No sales in this period yet.</div>
      ) : (
        <div className="bars" style={{ marginTop: 14 }}>
          {rows.map((r) => (
            <div className="bar-col" key={`${r.year}-${r.month}`}>
              <div className="bar-v num">{formatMoney0(r.netSalesRevenueCents / 100)}</div>
              <div className="bar-track">
                <div className="bar" style={{ height: `${Math.max(3, (r.netSalesRevenueCents / max) * 100)}%` }} />
              </div>
              <div className="bar-x">{r.label.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function TopCustomers({ customers }: { customers: TopCustomerRow[] }) {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label="Top customers"
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/reports/customers")}>
              Reports
            </Button>
          }
        />
      </div>
      {customers.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          No customer activity in this period.
        </div>
      ) : (
        <div className="rows">
          {customers.map((c) => (
            <div className="row" key={c.customerId} onClick={() => router.push(`/customers/${c.customerId}`)} style={{ cursor: "pointer" }}>
              <div className="row-main">
                <div className="row-t">{c.name}</div>
                <div className="row-s num">{c.code}</div>
              </div>
              <div className="row-end">
                <span className="num" style={{ fontSize: 14.5, fontWeight: 500 }}>
                  {formatCents(c.totalSalesCents)}
                </span>
                <span className="row-s num">
                  {c.numberOfSales} sale{c.numberOfSales === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CustomerInsights({ summary }: { summary: CustomerAnalyticsSummary }) {
  return (
    <Card padding="18px">
      <div className="lab" style={{ marginBottom: 14 }}>
        Customer insights
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Badge tone="brand">New {summary.newCustomers ?? "—"}</Badge>
        <Badge tone="info">Returning {summary.returningCustomers ?? "—"}</Badge>
        <Badge tone="success">Active {summary.activeCustomers}</Badge>
      </div>
      <SpecList
        dense
        items={[
          { label: "Total customers", value: summary.totalCustomers },
          { label: "Avg spend / customer", value: summary.avgCustomerSpendCents != null ? <span className="num">{formatCents(summary.avgCustomerSpendCents)}</span> : "—" },
        ]}
      />
    </Card>
  );
}

export function InventoryValueCard({ overview }: { overview: InventoryValueOverview }) {
  const router = useRouter();
  const items: SpecListItem[] = [
    { label: "String inventory", value: <span className="num">{formatMoney0(overview.stringValueDollars)}</span> },
    { label: "Retail inventory", value: <span className="num">{formatMoney0(overview.retailValueDollars)}</span> },
    { label: "String types", value: overview.stringProductCount },
    { label: "Inventory items", value: overview.retailProductCount },
    {
      label: "Low stock items",
      value: <span style={{ color: overview.totalLowStock + overview.totalOutOfStock > 0 ? "var(--signal-warning)" : undefined }}>{overview.totalLowStock + overview.totalOutOfStock}</span>,
    },
  ];
  return (
    <Card padding="18px">
      <PanelHead
        label="Total inventory value"
        action={
          <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/reports/inventory")}>
            Reports
          </Button>
        }
      />
      <div className="ph-t num" style={{ fontSize: 28, marginTop: 10 }}>
        {formatMoney0(overview.totalValueDollars)}
      </div>
      <SpecList dense items={items} />
    </Card>
  );
}

export function PopularStrings({ rows }: { rows: PopularStringRow[] }) {
  const router = useRouter();
  const max = Math.max(1, ...rows.map((r) => r.jobs));
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label="Most popular strings"
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/reports/stringing")}>
              Reports
            </Button>
          }
        />
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: "0 24px 16px" }} className="row-s">
          No string jobs yet.
        </div>
      ) : (
        <div style={{ padding: "0 24px 16px" }}>
          {rows.map((r) => (
            <div key={r.stringProductId} style={{ marginBottom: 10 }}>
              <div className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{[r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" ")}</span>
                <span className="num">
                  {r.jobs} job{r.jobs === 1 ? "" : "s"}
                </span>
              </div>
              <div className="blist-track">
                <div style={{ width: `${(r.jobs / max) * 100}%`, background: "var(--court-600)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function Dashboard({
  lowStock,
  recentMovements,
  salesStats,
  recentSales,
  monthFinancials,
  recentExpenses,
  salesSplit,
  stringJobCount,
  comparison,
  readyForCollection,
  recentJobs,
  activeJobCount,
  revenueTrendSlot,
  customersInventorySlot,
  initialFrom,
  initialTo,
}: {
  lowStock: MergedLowStockRow[];
  recentMovements: RecentMovementRow[];
  salesStats: DashboardSalesStats;
  recentSales: RecentSaleRow[];
  monthFinancials: FinancialSummary;
  recentExpenses: ExpenseListRow[];
  salesSplit: SalesSplit;
  stringJobCount: number;
  comparison: PeriodComparison;
  readyForCollection: ReadyForCollectionRow[];
  recentJobs: RecentJobRow[];
  activeJobCount: number;
  // Streamed in separately (their own async Server Component + Suspense
  // boundary, wired up in app/dashboard/page.tsx) rather than fetched
  // alongside everything else above — see that file's comment for why.
  revenueTrendSlot: ReactNode;
  customersInventorySlot: ReactNode;
  initialFrom: string;
  initialTo: string;
}) {
  const mixTotal = salesSplit.stringing.revenueCents + salesSplit.retail.revenueCents + salesSplit.other.revenueCents;
  return (
    <div className="dash">
      <div className="sec-head">
        <div className="lab">Today · {formatDateWithWeekday(new Date())}</div>
        <div className="hair" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <Card>
          <StatBlock label="Revenue (period)" value={formatMoney0(monthFinancials.netSalesRevenueCents / 100)} icon="banknote" />
        </Card>
        <Card>
          <StatBlock label="Sales revenue (today)" value={formatMoney0(salesStats.todayRevenueCents / 100)} icon="banknote" />
        </Card>
        <Card>
          <StatBlock label="String jobs (period)" value={stringJobCount} icon="wrench" />
        </Card>
        <Card>
          <StatBlock label="Retail sales (period)" value={formatCents(salesSplit.retail.revenueCents)} icon="package" />
        </Card>
        <Card>
          <StatBlock label="Unpaid sales" value={salesStats.unpaidSalesCount} unit="sales" icon="banknote" />
          <div className="row-s num" style={{ marginTop: 12 }}>
            {formatMoney0(salesStats.unpaidSalesCents / 100)} outstanding
          </div>
        </Card>
        <Card>
          <StatBlock label="Active jobs" value={activeJobCount} icon="wrench" />
        </Card>
      </div>

      <div className="sec-head">
        <div className="lab">Period</div>
        <div className="hair" />
      </div>
      <DateRangePicker basePath="/dashboard" initialFrom={initialFrom} initialTo={initialTo} />

      <div className="sec-head">
        <div className="lab">Profit and loss</div>
        <div className="hair" />
      </div>
      <div className="g1">
        <PL d={monthFinancials} label="Selected period" comparison={comparison} />
      </div>

      <div className="sec-head">
        <div className="lab">Charts</div>
        <div className="hair" />
      </div>
      <div className="g1">{revenueTrendSlot}</div>
      <div className="g2">
        <Card padding="18px" style={{ minWidth: 0 }}>
          <div className="lab" style={{ marginBottom: 12 }}>
            Revenue mix
          </div>
          {mixTotal === 0 ? (
            <div className="row-s">No sales in this period.</div>
          ) : (
            <>
              {[
                { label: "Stringing", v: salesSplit.stringing.revenueCents, fill: "var(--court-600)" },
                { label: "Retail", v: salesSplit.retail.revenueCents, fill: "var(--clay-500)" },
                ...(salesSplit.other.revenueCents !== 0 ? [{ label: "Other", v: salesSplit.other.revenueCents, fill: "var(--ink-400)" }] : []),
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 10 }}>
                  <div className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{row.label}</span>
                    <span className="num">{formatCents(row.v)}</span>
                  </div>
                  <div className="blist-track">
                    <div style={{ width: `${(row.v / mixTotal) * 100}%`, background: row.fill }} />
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
        <Link href="/reports/financial" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive padding="18px" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
            <div>
              <div className="lab" style={{ marginBottom: 8 }}>
                Expenses by category
              </div>
              <div className="row-s">Where operating expenses are going this period — see the full breakdown in Reports.</div>
            </div>
            <div className="row-s" style={{ color: "var(--court-600)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
              View in Reports <Icon name="arrow-right" size={14} />
            </div>
          </Card>
        </Link>
      </div>
      <div className="g3">
        <Link href="/reports/stringing" style={{ textDecoration: "none", color: "inherit" }}>
          <Card interactive padding="18px" style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
            <div>
              <div className="lab" style={{ marginBottom: 8 }}>
                String jobs trend
              </div>
              <div className="row-s">Monthly job volume — see the full trend and string usage breakdown in Reports.</div>
            </div>
            <div className="row-s" style={{ color: "var(--court-600)", display: "flex", alignItems: "center", gap: 4, marginTop: 12 }}>
              View in Reports <Icon name="arrow-right" size={14} />
            </div>
          </Card>
        </Link>
      </div>

      <div className="sec-head">
        <div className="lab">Customers &amp; inventory</div>
        <div className="hair" />
      </div>
      {customersInventorySlot}

      <div className="sec-head">
        <div className="lab">Needs attention</div>
        <div className="hair" />
      </div>
      <div className="g2">
        <ReadyList items={readyForCollection} />
        <LowStock items={lowStock} />
      </div>

      <div className="sec-head">
        <div className="lab">Activity</div>
        <div className="hair" />
      </div>
      <div className="g2">
        <RecentJobs jobs={recentJobs} />
        <RecentSales sales={recentSales} />
      </div>
      <div className="g2">
        <RecentExpenses expenses={recentExpenses} />
        <RecentInventoryMovements movements={recentMovements} />
      </div>
    </div>
  );
}
