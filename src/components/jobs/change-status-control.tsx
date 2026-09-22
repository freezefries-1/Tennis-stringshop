"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { changeJobStatusAction } from "@/app/jobs/actions";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "./job-status";
import type { JobStatus } from "@/lib/jobs";
import type { StockShortageView } from "@/lib/job-form-types";

export function ChangeStatusControl({ jobId, status }: { jobId: string; status: JobStatus }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={current}
          disabled={pending}
          onChange={(e) => setStatus(e.target.value as JobStatus)}
          style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 }}
        >
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {current !== "completed" && current !== "collected" && current !== "cancelled" ? (
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("completed")}>
            Mark completed
          </Button>
        ) : null}
        {current === "completed" ? (
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("collected")}>
            Mark collected
          </Button>
        ) : null}
      </div>
      {shortages ? (
        <div className="form-warning" style={{ maxWidth: 420 }}>
          <p>Not enough stock to complete this job:</p>
          <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
            {shortages.map((s, i) => (
              <li key={i} style={{ fontSize: 13.5 }}>
                {s.productLabel} ({s.role}): needed {s.neededM}
                {s.unit === "set" ? " sets" : "m"}, only {s.availableM}
                {s.unit === "set" ? " sets" : "m"} available
              </li>
            ))}
          </ul>
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("completed", true)}>
            Complete anyway (uses more stock than recorded)
          </Button>
        </div>
      ) : null}
    </div>
  );
}
