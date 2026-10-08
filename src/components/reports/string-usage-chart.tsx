import type { StringUsageRow } from "@/lib/reports-stringing";

const MAX_RANKED = 5;

function stringLabel(r: Pick<StringUsageRow, "brand" | "name" | "gauge" | "colour">): string {
  return [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" ");
}

/** "Most used" = share of completed/collected jobs in the period, matching
 * the usage table's own "Sort: Most used" option (job count, not metres or
 * revenue — a different question). Ranked bars rather than a pie: this
 * app's brand ramps (court/clay) are built for text and surfaces, not dense
 * categorical chart fills — they fail a CVD-safety check as a multi-hue
 * palette — so the #1 string carries the one accent (the direct answer to
 * "most used") and every other bar is a neutral gray, the emphasis form
 * from the dataviz method rather than a forced rainbow. */
export function StringUsageChart({ rows }: { rows: StringUsageRow[] }) {
  const totalJobs = rows.reduce((sum, r) => sum + r.jobs, 0);
  if (totalJobs === 0) {
    return <div className="row-s">No string usage in this period.</div>;
  }

  const sorted = [...rows].sort((a, b) => b.jobs - a.jobs);
  const ranked = sorted.slice(0, MAX_RANKED);
  const rest = sorted.slice(MAX_RANKED);
  const otherJobs = rest.reduce((sum, r) => sum + r.jobs, 0);

  const bars = [
    ...ranked.map((r, i) => ({
      key: r.stringProductId,
      label: stringLabel(r),
      jobs: r.jobs,
      fill: i === 0 ? "var(--court-600)" : "var(--ink-300)",
    })),
    ...(otherJobs > 0 ? [{ key: "__other", label: `Other (${rest.length} string${rest.length === 1 ? "" : "s"})`, jobs: otherJobs, fill: "var(--ink-200)" }] : []),
  ];

  const maxJobs = bars[0].jobs;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {bars.map((b) => {
        const pct = (b.jobs / totalJobs) * 100;
        return (
          <div key={b.key} title={`${b.label}: ${b.jobs} job${b.jobs === 1 ? "" : "s"} (${pct.toFixed(0)}% of jobs in period)`}>
            <div className="row-s" style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 8 }}>{b.label}</span>
              <span className="num" style={{ flex: "0 0 auto" }}>
                {b.jobs} {b.jobs === 1 ? "job" : "jobs"} · {pct.toFixed(0)}%
              </span>
            </div>
            <div className="blist-track">
              <div style={{ width: `${(b.jobs / maxJobs) * 100}%`, background: b.fill }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
