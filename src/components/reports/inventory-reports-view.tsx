"use client";

import { useState } from "react";
import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { Tabs } from "@/components/ds/tabs";
import { formatCents, formatMoney0, formatDate } from "@/lib/format";
import { DateRangePicker } from "./date-range-picker";
import { ExportCsvButton } from "./export-csv-button";
import { exportInventoryAnalysisCsvAction } from "@/app/reports/actions";
import type { InventoryValueOverview, StringMovementRow, ProductMovementRow, StockCoverRow, SlowMovingRow, InventoryPurchaseContext } from "@/lib/reports-inventory";

export function InventoryReportsView({
  overview,
  stringMovement,
  productMovement,
  stockCover,
  slowMoving,
  purchaseContext,
  cogsCents,
  initialFrom,
  initialTo,
}: {
  overview: InventoryValueOverview;
  stringMovement: StringMovementRow[];
  productMovement: ProductMovementRow[];
  stockCover: { strings: StockCoverRow[]; products: StockCoverRow[] };
  slowMoving: SlowMovingRow[];
  purchaseContext: InventoryPurchaseContext;
  cogsCents: number;
  initialFrom: string;
  initialTo: string;
}) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="rec-wrap">
      <DateRangePicker basePath="/reports/inventory" initialFrom={initialFrom} initialTo={initialTo} />
      <Tabs
        items={[
          { value: "overview", label: "Overview" },
          { value: "movement", label: "Movement (30/90d)" },
          { value: "cover", label: "Stock cover" },
          { value: "slow", label: "Slow-moving", count: slowMoving.length },
          { value: "purchases", label: "Purchase context" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Card padding="20px">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <StatBlock label="Total inventory value" value={formatMoney0(overview.totalValueDollars)} icon="layers" />
            <StatBlock label="String inventory value" value={formatMoney0(overview.stringValueDollars)} icon="layers" />
            <StatBlock label="Retail inventory value" value={formatMoney0(overview.retailValueDollars)} icon="package" />
            <StatBlock label="Low stock items" value={overview.totalLowStock} icon="alert-circle" />
            <StatBlock label="Out of stock items" value={overview.totalOutOfStock} icon="alert-circle" />
          </div>
          <div className="row-s" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            String and retail inventory stay separate systems — this is a combined view, not a merged table. {overview.stringLowStock + overview.stringOutOfStock} string item(s) and {overview.retailLowStock + overview.retailOutOfStock} retail item(s) need attention.
          </div>
        </Card>
      ) : null}

      {tab === "movement" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <ExportCsvButton filename={`inventory-analysis-${new Date().toISOString().slice(0, 10)}.csv`} fetchCsv={() => exportInventoryAnalysisCsvAction()} />
          </div>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 4 }}>
              String movement
            </div>
            <div className="row-s" style={{ marginBottom: 12 }}>
              Estimated consumption — recorded quantities at time of job, not a physical remeasurement.
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>String</th>
                    <th className="num">Stock</th>
                    <th className="num">Last 30 days</th>
                    <th className="num">Last 90 days</th>
                    <th className="num">Last movement</th>
                  </tr>
                </thead>
                <tbody>
                  {stringMovement.map((r) => (
                    <tr key={r.stringProductId}>
                      <td>
                        {r.brand} {r.name} {r.gauge ? `${r.gauge}mm` : ""} {r.colour ?? ""}
                      </td>
                      <td className="num">
                        {r.currentStock}
                        {r.trackingUnit === "set" ? " sets" : "m"}
                      </td>
                      <td className="num">{r.consumed30d.toFixed(1)}m</td>
                      <td className="num">{r.consumed90d.toFixed(1)}m</td>
                      <td className="num">{r.lastMovementAt ? formatDate(r.lastMovementAt) : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              Retail product movement
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Stock</th>
                    <th className="num">Sold last 30 days</th>
                    <th className="num">Sold last 90 days</th>
                    <th className="num">Last sale</th>
                  </tr>
                </thead>
                <tbody>
                  {productMovement.map((r) => (
                    <tr key={r.productId}>
                      <td>
                        {r.code} · {[r.brand, r.name, r.variant].filter(Boolean).join(" ")}
                      </td>
                      <td className="num">{r.currentStock}</td>
                      <td className="num">{r.unitsSold30d}</td>
                      <td className="num">{r.unitsSold90d}</td>
                      <td className="num">{r.lastMovementAt ? formatDate(r.lastMovementAt) : "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "cover" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding="14px 18px" tone="sunken">
            <div className="row-s">Estimated from the last 90 days of usage — only shown where there&rsquo;s actual recent consumption to base it on.</div>
          </Card>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              String stock cover
            </div>
            {stockCover.strings.length === 0 ? (
              <div className="row-s">Not enough recent usage to estimate stock cover.</div>
            ) : (
              <table className="dtable">
                <thead>
                  <tr>
                    <th>String</th>
                    <th className="num">Stock</th>
                    <th className="num">Avg / month</th>
                    <th className="num">Est. cover</th>
                  </tr>
                </thead>
                <tbody>
                  {stockCover.strings.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="num">{r.currentStock}m</td>
                      <td className="num">{r.avgMonthlyConsumption}m</td>
                      <td className="num">~{r.estimatedMonthsCover} months</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              Retail stock cover
            </div>
            {stockCover.products.length === 0 ? (
              <div className="row-s">Not enough recent sales to estimate stock cover.</div>
            ) : (
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Stock</th>
                    <th className="num">Avg / month</th>
                    <th className="num">Est. cover</th>
                  </tr>
                </thead>
                <tbody>
                  {stockCover.products.map((r) => (
                    <tr key={r.label}>
                      <td>{r.label}</td>
                      <td className="num">{r.currentStock}</td>
                      <td className="num">{r.avgMonthlyConsumption}</td>
                      <td className="num">~{r.estimatedMonthsCover} months</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "slow" ? (
        <Card padding="18px">
          <div className="lab" style={{ marginBottom: 6 }}>
            Slow-moving inventory
          </div>
          <div className="row-s" style={{ marginBottom: 12 }}>
            No sale or usage in 90+ days. These are facts about stock movement, not a judgement.
          </div>
          {slowMoving.length === 0 ? (
            <div className="row-s">Nothing slow-moving right now.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Stock</th>
                    <th className="num">Value</th>
                    <th className="num">Last movement</th>
                    <th className="num">Days since</th>
                  </tr>
                </thead>
                <tbody>
                  {slowMoving.map((r) => (
                    <tr key={`${r.kind}-${r.id}`}>
                      <td>{r.label}</td>
                      <td className="num">{r.stock}</td>
                      <td className="num">{formatCents(r.inventoryValueCents)}</td>
                      <td className="num">{r.lastMovementAt ? formatDate(r.lastMovementAt) : "Never"}</td>
                      <td className="num">{r.daysSinceMovement ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "purchases" ? (
        <Card padding="20px">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <StatBlock label="String stock purchased" value={formatCents(purchaseContext.stringPurchasedCents)} icon="layers" />
            <StatBlock label="Retail stock purchased" value={formatCents(purchaseContext.productPurchasedCents)} icon="package" />
            <StatBlock label="Total purchased (period)" value={formatCents(purchaseContext.totalPurchasedCents)} icon="banknote" />
            <StatBlock label="COGS (period)" value={formatCents(cogsCents)} icon="bar-chart-3" />
          </div>
          <div className="row-s" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-hairline)" }}>
            Stock purchased is cash converted into inventory, not an expense — it only becomes COGS once sold, via FIFO. These stay separate from Operating Expenses everywhere in this app.
          </div>
        </Card>
      ) : null}
    </div>
  );
}
