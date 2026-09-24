"use client";

import { useState } from "react";
import { Card } from "@/components/ds/card";
import { StatBlock } from "@/components/ds/stat-block";
import { Tabs } from "@/components/ds/tabs";
import { formatCents, formatCentsSigned, formatDate } from "@/lib/format";
import { DateRangePicker } from "./date-range-picker";
import { ExportCsvButton } from "./export-csv-button";
import { exportStringUsageCsvAction } from "@/app/reports/actions";
import type { StringingOverview, StringUsageRow, StringBrandRow, StringSetupAnalytics } from "@/lib/reports-stringing";
import type { RacketBrandRow, RacketSeriesRow, RacketModelRow, RestringFrequencyRow, PotentiallyDueRow } from "@/lib/reports-rackets";

type SortKey = "jobs" | "revenue" | "grossProfit" | "stock";

function sortUsage(rows: StringUsageRow[], key: SortKey): StringUsageRow[] {
  const sorted = [...rows];
  if (key === "jobs") sorted.sort((a, b) => b.jobs - a.jobs);
  else if (key === "revenue") sorted.sort((a, b) => b.revenueCents - a.revenueCents);
  else if (key === "grossProfit") sorted.sort((a, b) => b.grossProfitCents - a.grossProfitCents);
  else if (key === "stock") sorted.sort((a, b) => Number(a.currentStock) - Number(b.currentStock));
  return sorted;
}

function selectStyle(): React.CSSProperties {
  return { height: 34, padding: "0 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 13 };
}

export function StringingReportsView({
  overview,
  stringUsage,
  brandAnalysis,
  setupAnalytics,
  racketBrands,
  racketSeries,
  racketModels,
  restringFrequency,
  potentiallyDue,
  initialFrom,
  initialTo,
}: {
  overview: StringingOverview;
  stringUsage: StringUsageRow[];
  brandAnalysis: StringBrandRow[];
  setupAnalytics: StringSetupAnalytics;
  racketBrands: RacketBrandRow[];
  racketSeries: RacketSeriesRow[];
  racketModels: RacketModelRow[];
  restringFrequency: RestringFrequencyRow[];
  potentiallyDue: PotentiallyDueRow[];
  initialFrom: string;
  initialTo: string;
}) {
  const [tab, setTab] = useState("overview");
  const [usageSort, setUsageSort] = useState<SortKey>("revenue");

  return (
    <div className="rec-wrap">
      <DateRangePicker basePath="/reports/stringing" initialFrom={initialFrom} initialTo={initialTo} />
      <Tabs
        items={[
          { value: "overview", label: "Overview" },
          { value: "usage", label: "String usage" },
          { value: "brands", label: "Brand analysis" },
          { value: "setup", label: "Setup analytics" },
          { value: "rackets", label: "Rackets" },
          { value: "restring", label: "Restring frequency" },
          { value: "due", label: "Potentially due", count: potentiallyDue.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" ? (
        <Card padding="20px">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
            <StatBlock label="String jobs" value={overview.jobCount} icon="wrench" />
            <StatBlock label="Stringing revenue" value={formatCents(overview.revenueCents)} icon="banknote" />
            <StatBlock label="String COGS" value={formatCents(overview.cogsCents)} icon="package" />
            <StatBlock label="Gross profit" value={formatCentsSigned(overview.grossProfitCents)} icon="bar-chart-3" />
            <StatBlock label="Avg revenue / job" value={overview.avgRevenuePerJobCents === null ? "—" : formatCents(overview.avgRevenuePerJobCents)} icon="banknote" />
            <StatBlock label="Avg gross profit / job" value={overview.avgGrossProfitPerJobCents === null ? "—" : formatCentsSigned(overview.avgGrossProfitPerJobCents)} icon="trending-up" />
          </div>
        </Card>
      ) : null}

      {tab === "usage" ? (
        <Card padding="18px">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div className="lab">String usage by product</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <select value={usageSort} onChange={(e) => setUsageSort(e.target.value as SortKey)} style={selectStyle()}>
                <option value="revenue">Sort: Most revenue</option>
                <option value="jobs">Sort: Most used</option>
                <option value="grossProfit">Sort: Most gross profit</option>
                <option value="stock">Sort: Lowest stock</option>
              </select>
              <ExportCsvButton
                filename={`string-usage-${new Date().toISOString().slice(0, 10)}.csv`}
                fetchCsv={() => exportStringUsageCsvAction({ dateFrom: initialFrom ? new Date(initialFrom) : null, dateTo: initialTo ? new Date(initialTo) : null })}
              />
            </div>
          </div>
          {stringUsage.length === 0 ? (
            <div className="row-s">No string usage in this period.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>String</th>
                    <th className="num">Jobs</th>
                    <th className="num">Est. metres used</th>
                    <th className="num">Revenue</th>
                    <th className="num">COGS</th>
                    <th className="num">Gross profit</th>
                    <th className="num">Current stock</th>
                  </tr>
                </thead>
                <tbody>
                  {sortUsage(stringUsage, usageSort).map((r) => (
                    <tr key={r.stringProductId}>
                      <td>
                        {r.brand} {r.name} {r.gauge ? `${r.gauge}mm` : ""} {r.colour ?? ""}
                      </td>
                      <td className="num">{r.jobs}</td>
                      <td className="num">{r.estimatedMetresConsumed.toFixed(1)}m</td>
                      <td className="num">{formatCents(r.revenueCents)}</td>
                      <td className="num">{formatCents(r.cogsCents)}</td>
                      <td className="num">{formatCentsSigned(r.grossProfitCents)}</td>
                      <td className="num">
                        {r.currentStock}
                        {r.trackingUnit === "set" ? " sets" : "m"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "brands" ? (
        <Card padding="18px">
          <div className="lab" style={{ marginBottom: 12 }}>
            String brand analysis
          </div>
          {brandAnalysis.length === 0 ? (
            <div className="row-s">No string usage in this period.</div>
          ) : (
            <table className="dtable">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th className="num">Jobs</th>
                  <th className="num">Est. metres used</th>
                  <th className="num">Revenue</th>
                  <th className="num">COGS</th>
                  <th className="num">Gross profit</th>
                </tr>
              </thead>
              <tbody>
                {brandAnalysis.map((b) => (
                  <tr key={b.brand}>
                    <td>{b.brand}</td>
                    <td className="num">{b.jobs}</td>
                    <td className="num">{b.estimatedMetresConsumed.toFixed(1)}m</td>
                    <td className="num">{formatCents(b.revenueCents)}</td>
                    <td className="num">{formatCents(b.cogsCents)}</td>
                    <td className="num">{formatCentsSigned(b.grossProfitCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ) : null}

      {tab === "setup" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding="14px 18px" tone="sunken">
            <div className="row-s">
              Based on {setupAnalytics.sampleSizeJobs} job{setupAnalytics.sampleSizeJobs === 1 ? "" : "s"} ({setupAnalytics.sampleSizeLines} string lines) in this period. Small samples aren&rsquo;t a reliable trend.
            </div>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <Card padding="18px">
              <div className="lab" style={{ marginBottom: 10 }}>
                Most common tensions
              </div>
              {setupAnalytics.mostCommonTensions.length === 0 ? (
                <div className="row-s">No data.</div>
              ) : (
                setupAnalytics.mostCommonTensions.map((t) => (
                  <div key={`${t.tension}-${t.unit}`} className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>
                      {t.tension} {t.unit}
                    </span>
                    <span className="num">{t.count}</span>
                  </div>
                ))
              )}
            </Card>
            <Card padding="18px">
              <div className="lab" style={{ marginBottom: 10 }}>
                Average tension
              </div>
              <div className="row-s" style={{ marginBottom: 4, fontWeight: 600 }}>
                Main
              </div>
              {setupAnalytics.avgMainTension.length === 0 ? <div className="row-s">No data.</div> : setupAnalytics.avgMainTension.map((t) => (
                <div key={t.unit} className="row-s">
                  {t.avg} {t.unit} (n={t.n})
                </div>
              ))}
              <div className="row-s" style={{ marginTop: 10, marginBottom: 4, fontWeight: 600 }}>
                Cross
              </div>
              {setupAnalytics.avgCrossTension.length === 0 ? <div className="row-s">No data.</div> : setupAnalytics.avgCrossTension.map((t) => (
                <div key={t.unit} className="row-s">
                  {t.avg} {t.unit} (n={t.n})
                </div>
              ))}
            </Card>
            <Card padding="18px">
              <div className="lab" style={{ marginBottom: 10 }}>
                Setup type
              </div>
              {setupAnalytics.setupTypeSplit.length === 0 ? <div className="row-s">No data.</div> : setupAnalytics.setupTypeSplit.map((s) => (
                <div key={s.setupType} className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{s.setupType === "full" ? "Full bed" : "Hybrid"}</span>
                  <span className="num">{s.count}</span>
                </div>
              ))}
              <div className="row-s" style={{ marginTop: 10, marginBottom: 4, fontWeight: 600 }}>
                String source (per line)
              </div>
              {setupAnalytics.customerSuppliedSplit.map((s) => (
                <div key={String(s.customerSupplied)} className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{s.customerSupplied ? "Customer supplied" : "SportCraft stock"}</span>
                  <span className="num">{s.count}</span>
                </div>
              ))}
            </Card>
            <Card padding="18px">
              <div className="lab" style={{ marginBottom: 10 }}>
                Most common knot count
              </div>
              {setupAnalytics.mostCommonKnotCount.length === 0 ? (
                <div className="row-s">No data.</div>
              ) : (
                setupAnalytics.mostCommonKnotCount.map((k) => (
                  <div key={k.knots} className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{k.knots} knots</span>
                    <span className="num">{k.count}</span>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {tab === "rackets" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              String jobs by racket brand
            </div>
            {racketBrands.length === 0 ? (
              <div className="row-s">No jobs in this period.</div>
            ) : (
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th className="num">Jobs</th>
                    <th className="num">Rackets</th>
                  </tr>
                </thead>
                <tbody>
                  {racketBrands.map((r) => (
                    <tr key={r.brand}>
                      <td>{r.brand}</td>
                      <td className="num">{r.jobs}</td>
                      <td className="num">{r.rackets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              String jobs by series
            </div>
            {racketSeries.length === 0 ? (
              <div className="row-s">No data.</div>
            ) : (
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Series</th>
                    <th className="num">Jobs</th>
                    <th className="num">Rackets</th>
                  </tr>
                </thead>
                <tbody>
                  {racketSeries.map((r) => (
                    <tr key={`${r.brand}-${r.series}`}>
                      <td>{r.brand}</td>
                      <td>{r.series}</td>
                      <td className="num">{r.jobs}</td>
                      <td className="num">{r.rackets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card padding="18px">
            <div className="lab" style={{ marginBottom: 12 }}>
              String jobs by model
            </div>
            {racketModels.length === 0 ? (
              <div className="row-s">No jobs in this period.</div>
            ) : (
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th className="num">Jobs</th>
                    <th className="num">Rackets</th>
                  </tr>
                </thead>
                <tbody>
                  {racketModels.map((r) => (
                    <tr key={`${r.brand}-${r.series}-${r.model}-${r.generationYear}-${r.generationName}`}>
                      <td>
                        {r.brand} {r.series} {r.model} {r.generationYear ?? ""} {r.generationName ?? ""}
                      </td>
                      <td className="num">{r.jobs}</td>
                      <td className="num">{r.rackets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "restring" ? (
        <Card padding="18px">
          <div className="lab" style={{ marginBottom: 12 }}>
            Restring frequency (all time, rackets with 2+ completed jobs)
          </div>
          {restringFrequency.length === 0 ? (
            <div className="row-s">Not enough stringing history yet — a racket needs at least 2 completed jobs to calculate an interval.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Racket</th>
                    <th className="num">Jobs</th>
                    <th className="num">Avg days</th>
                    <th className="num">Median days</th>
                    <th className="num">Last stringing</th>
                    <th className="num">Days since</th>
                  </tr>
                </thead>
                <tbody>
                  {restringFrequency.map((r) => (
                    <tr key={r.customerRacketId}>
                      <td>
                        {r.customerName} ({r.customerCode})
                      </td>
                      <td>{r.racketLabel}</td>
                      <td className="num">{r.jobCount}</td>
                      <td className="num">{r.avgDays ?? "—"}</td>
                      <td className="num">{r.medianDays ?? "—"}</td>
                      <td className="num">{formatDate(r.lastStringingDate)}</td>
                      <td className="num">{r.daysSinceLastStringing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === "due" ? (
        <Card padding="18px">
          <div className="lab" style={{ marginBottom: 6 }}>
            Potentially due for a restring
          </div>
          <div className="row-s" style={{ marginBottom: 12 }}>
            Based on each racket&rsquo;s own previous restring pattern — not a guarantee, and never sent automatically. Only rackets with enough history (2+ completed jobs) are shown.
          </div>
          {potentiallyDue.length === 0 ? (
            <div className="row-s">Nothing potentially due right now.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Racket</th>
                    <th className="num">Last stringing</th>
                    <th className="num">Typical interval</th>
                    <th className="num">Days since</th>
                    <th className="num">Overdue by</th>
                  </tr>
                </thead>
                <tbody>
                  {potentiallyDue.map((r) => (
                    <tr key={r.customerRacketId}>
                      <td>
                        {r.customerName} ({r.customerCode})
                      </td>
                      <td>{r.racketLabel}</td>
                      <td className="num">{formatDate(r.lastStringingDate)}</td>
                      <td className="num">{r.avgDays} days</td>
                      <td className="num">{r.daysSinceLastStringing} days</td>
                      <td className="num">{r.overdueByDays} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
