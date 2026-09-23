"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { changeJobStatusAction } from "@/app/jobs/actions";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "./job-status";
import type { JobStatus } from "@/lib/jobs";
import type { StockShortageView } from "@/lib/job-form-types";

function selectStyle(): React.CSSProperties {
  return { height: 32, padding: "0 8px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 13 };
}

/** Same changeJobStatusAction as the detail page's ChangeStatusControl, so
 * the insufficient-stock gate on "completed" (brief §14) applies here too —
 * not a copy of that component because the jobs list needs a much
 * narrower, dropdown-only footprint (no Mark completed/collected shortcut
 * buttons) that fits inside a table cell or list card without pushing
 * layout around. stopPropagation on the wrapper keeps clicks on the
 * control from also triggering the row's navigate-to-job-detail handler. */
export function JobStatusSelect({ jobId, status }: { jobId: string; status: JobStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(status);
  const [shortages, setShortages] = useState<StockShortageView[] | null>(null);

  const setStatus = (s: JobStatus, allowStockOverride = false) => {
    startTransition(async () => {
      const result = await changeJobStatusAction(jobId, s, allowStockOverride);
      if (!result.ok) {
        if (result.reason === "insufficient_stock") setShortages(result.shortages);
        return;
      }
      setShortages(null);
      setCurrent(s);
      router.refresh();
    });
  };

  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select value={current} disabled={pending} onChange={(e) => setStatus(e.target.value as JobStatus)} style={selectStyle()}>
        {JOB_STATUSES.map((s) => (
          <option key={s} value={s}>
            {JOB_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {shortages ? (
        <div className="form-warning" style={{ maxWidth: 240 }}>
          <p style={{ fontSize: 12.5 }}>Not enough stock to complete this job.</p>
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("completed", true)}>
            Complete anyway
          </Button>
        </div>
      ) : null}
    </div>
  );
}
