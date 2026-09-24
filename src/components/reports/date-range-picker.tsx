"use client";

// Shared date-range control for every Reports page — same preset/custom-
// range UI FinancialsView established (Phase 7), factored out here since
// Phase 8 needs it on six more pages. Pushes `from`/`to` (or clears them for
// "All time") into the current page's own URL via the App Router, so every
// report stays a plain server-rendered page that re-fetches on navigation —
// no client-side data-fetching duplicated per report.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { DATE_FILTER_LABEL, presetRange, detectPreset, toLocalDateInputValue, type DateFilterPreset } from "@/lib/date-filter";

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

export function DateRangePicker({ basePath, initialFrom, initialTo, extraParams }: { basePath: string; initialFrom: string; initialTo: string; extraParams?: Record<string, string> }) {
  const router = useRouter();
  const dateFilter = detectPreset(initialFrom, initialTo);
  const [customFrom, setCustomFrom] = useState(() => (dateFilter === "custom" && initialFrom ? toLocalDateInputValue(new Date(initialFrom)) : ""));
  const [customTo, setCustomTo] = useState(() => {
    if (dateFilter !== "custom" || !initialTo) return "";
    const end = new Date(initialTo);
    end.setDate(end.getDate() - 1);
    return toLocalDateInputValue(end);
  });

  function pushPreset(preset: DateFilterPreset, from = customFrom, to = customTo) {
    const [start, end] = presetRange(preset, from, to);
    const params = new URLSearchParams(extraParams);
    if (start) params.set("from", start.toISOString());
    if (end) params.set("to", end.toISOString());
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
      <select value={dateFilter} onChange={(e) => pushPreset(e.target.value as DateFilterPreset)} style={selectStyle()}>
        {(Object.keys(DATE_FILTER_LABEL) as DateFilterPreset[]).map((f) => (
          <option key={f} value={f}>
            {DATE_FILTER_LABEL[f]}
          </option>
        ))}
      </select>
      {dateFilter === "custom" ? (
        <div className="date-range-custom">
          <Field label="From" style={{ flex: "1 1 160px", minWidth: 0, maxWidth: 200 }}>
            <Input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); pushPreset("custom", e.target.value, customTo); }} style={{ width: "100%", minWidth: 0 }} />
          </Field>
          <Field label="To" style={{ flex: "1 1 160px", minWidth: 0, maxWidth: 200 }}>
            <Input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); pushPreset("custom", customFrom, e.target.value); }} style={{ width: "100%", minWidth: 0 }} />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
