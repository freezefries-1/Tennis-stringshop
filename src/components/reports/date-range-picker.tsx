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
  // Selecting "Custom range" with neither date filled in yet resolves to
  // [null, null], which pushPreset can't tell apart from "All time" (neither
  // param gets set) — without this, the dropdown would round-trip straight
  // back to "all" before the user gets a chance to type a date. This bridges
  // that gap; it's cleared once the URL's own from/to actually change (a real
  // date got picked, or a different preset/browser-nav took over).
  const [pendingCustom, setPendingCustom] = useState(false);
  // "Adjusting state when a prop changes" (React's own recommended pattern
  // for this, done during render rather than in an effect): once the URL's
  // own from/to actually move — a real date got picked, a different preset
  // or browser-nav took over — drop back to deriving dateFilter from props.
  const [trackedRange, setTrackedRange] = useState([initialFrom, initialTo]);
  if (trackedRange[0] !== initialFrom || trackedRange[1] !== initialTo) {
    setTrackedRange([initialFrom, initialTo]);
    setPendingCustom(false);
  }
  const dateFilter = pendingCustom ? "custom" : detectPreset(initialFrom, initialTo);
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

  function handlePresetChange(preset: DateFilterPreset) {
    if (preset === "custom") {
      setPendingCustom(true);
      return;
    }
    // Explicit, not left to the trackedRange effect above: a page like
    // Dashboard defaults an empty URL to "This month" rather than true
    // "all", so picking "All time" while that happens to already be the
    // active range would otherwise leave pendingCustom stuck true forever
    // (the props never actually change, so nothing would clear it).
    setPendingCustom(false);
    pushPreset(preset);
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
      <select value={dateFilter} onChange={(e) => handlePresetChange(e.target.value as DateFilterPreset)} style={selectStyle()}>
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
