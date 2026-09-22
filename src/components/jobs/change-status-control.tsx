"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { changeJobStatusAction } from "@/app/jobs/actions";
import { JOB_STATUSES, JOB_STATUS_LABEL } from "./job-status";
import type { JobStatus } from "@/lib/jobs";

export function ChangeStatusControl({ jobId, status }: { jobId: string; status: JobStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(status);

  const setStatus = (s: JobStatus) => {
    startTransition(async () => {
      await changeJobStatusAction(jobId, s);
      setCurrent(s);
      router.refresh();
    });
  };

  return (
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
  );
}
