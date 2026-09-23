"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { ProgressBar } from "@/components/ds/progress-bar";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { StatBlock } from "@/components/ds/stat-block";
import { DATA } from "@/lib/data";
import { formatMoney, formatMoney0, formatCents, formatDate } from "@/lib/format";
import type { RecentMovementRow } from "@/lib/string-inventory";
import type { DashboardSalesStats, RecentSaleRow } from "@/lib/sales";

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

interface PLTotals {
  rev: number;
  cogs: number;
  gross: number;
  exp: number;
  net: number;
}

function PL({ d, label, extra }: { d: PLTotals; label: string; extra?: SpecListItem[] }) {
  const items: SpecListItem[] = [
    { label: "Revenue", value: <span className="num">{formatMoney0(d.rev)}</span> },
    { label: "COGS", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{formatMoney0(d.cogs)}</span> },
    {
      label: "Gross profit",
      value: (
        <span className="num">
          {formatMoney0(d.gross)} <span className="pct">{Math.round((d.gross / d.rev) * 100)}%</span>
        </span>
      ),
    },
    { label: "Expenses", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{formatMoney0(d.exp)}</span> },
    ...(extra ?? []),
  ];
  return (
    <Card padding="20px 24px 24px">
      <PanelHead label={label} />
      <SpecList dense items={items} />
      <div className="net">
        <span>Net profit</span>
        <span className="num">{formatMoney0(d.net)}</span>
      </div>
    </Card>
  );
}

function RevenueChart() {
  const rows = DATA.monthly;
  const max = Math.max(...rows.map((r) => r.rev));
  const jmax = Math.max(...rows.map((r) => r.jobs));
  const jmin = Math.min(...rows.map((r) => r.jobs));
  const pts = rows
    .map((r, i) => `${(i + 0.5) * (100 / rows.length)},${34 - ((r.jobs - jmin) / (jmax - jmin || 1)) * 28}`)
    .join(" ");
  return (
    <Card padding="20px 24px 22px">
      <PanelHead
        label="Last 12 months"
        title="Revenue and gross profit"
        action={
          <div className="legend">
            <span>
              <i style={{ background: "var(--court-600)" }} />
              Gross profit
            </span>
            <span>
              <i style={{ background: "var(--court-100)" }} />
              COGS
            </span>
          </div>
        }
      />
      <div className="bars">
        {rows.map((r) => (
          <div className="bar-col" key={r.m} title={`${r.m} · ${formatMoney0(r.rev)} revenue`}>
            <div className="bar-v num">{Math.round(r.rev / 100) / 10}k</div>
            <div className="bar-track">
              <div className="bar" style={{ height: (r.rev / max) * 100 + "%" }}>
                <div className="bar-cogs" style={{ height: (r.cogs / r.rev) * 100 + "%" }} />
              </div>
            </div>
            <div className="bar-x num">{r.m.slice(0, 3)}</div>
          </div>
        ))}
      </div>
      <div className="spark-wrap">
        <div className="lab" style={{ marginBottom: 6 }}>
          String jobs per month · {jmin}–{jmax}
        </div>
        <svg viewBox="0 0 100 38" preserveAspectRatio="none" className="spark">
          <polyline points={pts} fill="none" stroke="var(--clay-500)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
    </Card>
  );
}

interface BarListRow {
  label: string;
  v: number;
  dot?: string;
  fill?: string;
}

function BarList({ label, title, rows, valueFmt }: { label: string; title: string; rows: BarListRow[]; valueFmt: (r: BarListRow) => string }) {
  const max = Math.max(...rows.map((r) => r.v));
  return (
    <Card padding="20px 24px 22px">
      <PanelHead label={label} title={title} />
      <div className="blist">
        {rows.map((r) => (
          <div className="blist-row" key={r.label}>
            <div className="blist-top">
              <span className="blist-l">
                {r.dot ? <i className="dot" style={{ background: r.dot }} /> : null}
                {r.label}
              </span>
              <span className="num blist-v">{valueFmt(r)}</span>
            </div>
            <div className="blist-track">
              <div style={{ width: (r.v / max) * 100 + "%", background: r.fill || "var(--court-600)" }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReadyList() {
  const router = useRouter();
  return (
    <Card padding="20px 0 8px">
      <div style={{ padding: "0 24px" }}>
        <PanelHead
          label={`Waiting for collection · ${DATA.ready.length}`}
          action={
            <Button size="sm" variant="ghost" iconRight="arrow-right" onClick={() => router.push("/jobs")}>
              All jobs
            </Button>
          }
        />
      </div>
      <div className="rows">
        {DATA.ready.map((j) => (
          <div className="row" key={j.id}>
            <div className="row-main">
              <div className="row-t">{j.customer}</div>
              <div className="row-s num">
                {j.id} · {j.racket}
              </div>
            </div>
            <div className="row-end">
              <span className="row-s num">Ready {j.since}</span>
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
    string_job: "String job",
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

function RecentJobs() {
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
      <div className="rows">
        {DATA.jobs.map((j) => (
          <div className="row" key={j.id}>
            <div className="row-main">
              <div className="row-t">{j.racket}</div>
              <div className="row-s num">
                <i className="dot" style={{ background: j.family }} />
                {j.id} · {j.customer} · {j.string} · {j.tension}
              </div>
            </div>
            <div className="row-end">
              <span className="row-s num">{j.due}</span>
              <Badge tone={j.tone} dot>
                {j.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
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

export function Dashboard({
  lowStock,
  recentMovements,
  salesStats,
  recentSales,
}: {
  lowStock: MergedLowStockRow[];
  recentMovements: RecentMovementRow[];
  salesStats: DashboardSalesStats;
  recentSales: RecentSaleRow[];
}) {
  const t = DATA.today;
  return (
    <div className="dash">
      <div className="sec-head">
        <div className="lab">Today · {DATA.business.today}</div>
        <div className="hair" />
      </div>
      <div className="g4">
        <Card>
          <StatBlock label="Sales revenue" value={formatMoney0(salesStats.todayRevenueCents / 100)} icon="banknote" />
          <div className="row-s num" style={{ marginTop: 12 }}>
            This month {formatMoney0(salesStats.monthRevenueCents / 100)} · gross profit {formatMoney0(salesStats.monthGrossProfitCents / 100)}
          </div>
        </Card>
        <Card>
          <StatBlock label="String jobs" value={t.jobs} unit="done" icon="wrench" />
        </Card>
        <Card>
          <StatBlock label="Unpaid sales" value={salesStats.unpaidSalesCount} unit="sales" icon="banknote" />
          <div className="row-s num" style={{ marginTop: 12 }}>
            {formatMoney0(salesStats.unpaidSalesCents / 100)} outstanding
          </div>
        </Card>
        <Card>
          <ProgressBar label="Bench load" value={t.benchLoad} max={t.benchCapacity} valueLabel={`${t.benchLoad} / ${t.benchCapacity}`} />
          <div className="row-s num" style={{ marginTop: 12 }}>
            {t.dueToday} due today · {DATA.unbilled} completed but unbilled
          </div>
        </Card>
      </div>

      <div className="sec-head">
        <div className="lab">Profit and loss</div>
        <div className="hair" />
      </div>
      <div className="g2">
        <PL
          d={DATA.month}
          label="This month · September 2026"
          extra={[
            { label: "String jobs", value: <span className="num">{DATA.month.jobs}</span> },
            { label: "Average job value", value: <span className="num">{formatMoney(DATA.month.avgJob)}</span> },
          ]}
        />
        <PL d={DATA.ytd} label="Year to date · 2026" />
      </div>

      <div className="g1">
        <RevenueChart />
      </div>

      <div className="g3">
        <BarList
          label="Year to date"
          title="Revenue by category"
          rows={DATA.categories.map((c) => ({ label: c.label, v: c.value, fill: c.tone }))}
          valueFmt={(r) => formatMoney0(r.v)}
        />
        <BarList
          label="Year to date"
          title="Most-used strings"
          rows={DATA.topStrings.map((s) => ({ label: s.label, v: s.metres, dot: s.family, fill: "var(--court-500)" }))}
          valueFmt={(r) => r.v + " m"}
        />
        <BarList
          label="Year to date"
          title="Best-selling products"
          rows={DATA.topProducts.map((p) => ({ label: p.label, v: p.rev, fill: "var(--clay-500)" }))}
          valueFmt={(r) => formatMoney0(r.v)}
        />
      </div>

      <div className="sec-head">
        <div className="lab">Needs attention</div>
        <div className="hair" />
      </div>
      <div className="g2">
        <ReadyList />
        <LowStock items={lowStock} />
      </div>

      <div className="sec-head">
        <div className="lab">Activity</div>
        <div className="hair" />
      </div>
      <div className="g2">
        <RecentJobs />
        <RecentSales sales={recentSales} />
      </div>
      <div className="g1">
        <RecentInventoryMovements movements={recentMovements} />
      </div>
    </div>
  );
}
