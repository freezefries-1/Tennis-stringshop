"use client";

import { useState } from "react";
import { Card } from "@/components/ds/card";
import { Tabs } from "@/components/ds/tabs";
import { formatCents, formatCentsSigned } from "@/lib/format";
import { DateRangePicker } from "./date-range-picker";
import { ExportCsvButton } from "./export-csv-button";
import { exportProductAnalyticsCsvAction } from "@/app/reports/actions";
import type { ProductAnalyticsRow, TopProductRow, ProductCategoryRow } from "@/lib/reports-products";

type SortKey = "units" | "revenue" | "grossProfit" | "margin";

function sortRows(rows: ProductAnalyticsRow[], key: SortKey): ProductAnalyticsRow[] {
  const sorted = [...rows];
  if (key === "units") sorted.sort((a, b) => b.unitsSold - a.unitsSold);
  else if (key === "revenue") sorted.sort((a, b) => b.revenueCents - a.revenueCents);
  else if (key === "grossProfit") sorted.sort((a, b) => b.grossProfitCents - a.grossProfitCents);
  else if (key === "margin") sorted.sort((a, b) => (b.grossMarginPct ?? -Infinity) - (a.grossMarginPct ?? -Infinity));
  return sorted;
}

function selectStyle(): React.CSSProperties {
  return { height: 34, padding: "0 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 13 };
}

function TopList({ title, rows, valueFmt }: { title: string; rows: TopProductRow[]; valueFmt: (v: number) => string }) {
  return (
    <Card padding="18px">
      <div className="lab" style={{ marginBottom: 12 }}>
        {title}
      </div>
      {rows.length === 0 ? (
        <div className="row-s">No data in this period.</div>
      ) : (
        rows.map((r, i) => (
          <div key={r.productId} className="row-s" style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < rows.length - 1 ? "1px solid var(--border-hairline)" : "none" }}>
            <span>{r.label}</span>
            <span className="num">{valueFmt(r.value)}</span>
          </div>
        ))
      )}
    </Card>
  );
}

export function ProductReportsView({
  analytics,
  topByUnits,
  topByRevenue,
  topByGrossProfit,
  categoryAnalysis,
  initialFrom,
  initialTo,
}: {
  analytics: ProductAnalyticsRow[];
  topByUnits: TopProductRow[];
  topByRevenue: TopProductRow[];
  topByGrossProfit: TopProductRow[];
  categoryAnalysis: ProductCategoryRow[];
  initialFrom: string;
  initialTo: string;
}) {
  const [tab, setTab] = useState("overview");
  const [sortKey, setSortKey] = useState<SortKey>("revenue");

  return (
    <div className="rec-wrap">
      <DateRangePicker basePath="/reports/products" initialFrom={initialFrom} initialTo={initialTo} />
      <Tabs
        items={[
          { value: "overview", label: "Overview" },
          { value: "top", label: "Top products" },
          { value: "category", label: "Category analysis" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Card padding="18px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div className="lab">Products (units sold this period, or in stock)</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} style={selectStyle()}>
                <option value="revenue">Sort: Revenue</option>
                <option value="units">Sort: Units sold</option>
                <option value="grossProfit">Sort: Gross profit</option>
                <option value="margin">Sort: Gross margin</option>
              </select>
              <ExportCsvButton
                filename={`product-performance-${new Date().toISOString().slice(0, 10)}.csv`}
                fetchCsv={() => exportProductAnalyticsCsvAction({ dateFrom: initialFrom ? new Date(initialFrom) : null, dateTo: initialTo ? new Date(initialTo) : null })}
              />
            </div>
          </div>
          {analytics.length === 0 ? (
            <div className="row-s">No product sales in this period.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="num">Units sold</th>
                    <th className="num">Revenue</th>
                    <th className="num">COGS</th>
                    <th className="num">Gross profit</th>
                    <th className="num">Margin</th>
                    <th className="num">Stock</th>
                    <th className="num">Stock value</th>
                  </tr>
                </thead>
                <tbody>
                  {sortRows(analytics, sortKey).map((r) => (
                    <tr key={r.productId}>
                      <td>
                        {r.code} · {[r.brand, r.name, r.variant].filter(Boolean).join(" ")}
                      </td>
                      <td>{r.categoryName}</td>
                      <td className="num">{r.unitsSold}</td>
                      <td className="num">{formatCents(r.revenueCents)}</td>
                      <td className="num">{formatCents(r.cogsCents)}</td>
                      <td className="num">{formatCentsSigned(r.grossProfitCents)}</td>
                      <td className="num">{r.grossMarginPct === null ? "—" : `${r.grossMarginPct.toFixed(1)}%`}</td>
                      <td className="num">{r.currentStock}</td>
                      <td className="num">{formatCents(r.inventoryValueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "top" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <TopList title="Top by units sold" rows={topByUnits} valueFmt={(v) => String(v)} />
          <TopList title="Top by revenue" rows={topByRevenue} valueFmt={formatCents} />
          <TopList title="Top by gross profit" rows={topByGrossProfit} valueFmt={formatCents} />
        </div>
      ) : null}

      {tab === "category" ? (
        <Card padding="18px">
          <div className="lab" style={{ marginBottom: 12 }}>
            By category
          </div>
          {categoryAnalysis.length === 0 ? (
            <div className="row-s">No product sales in this period.</div>
          ) : (
            <table className="dtable">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Units sold</th>
                  <th className="num">Revenue</th>
                  <th className="num">COGS</th>
                  <th className="num">Gross profit</th>
                  <th className="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                {categoryAnalysis.map((c) => (
                  <tr key={c.categoryId}>
                    <td>{c.categoryName}</td>
                    <td className="num">{c.unitsSold}</td>
                    <td className="num">{formatCents(c.revenueCents)}</td>
                    <td className="num">{formatCents(c.cogsCents)}</td>
                    <td className="num">{formatCentsSigned(c.grossProfitCents)}</td>
                    <td className="num">{c.grossMarginPct === null ? "—" : `${c.grossMarginPct.toFixed(1)}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : null}
    </div>
  );
}
