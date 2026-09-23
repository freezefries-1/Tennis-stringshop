"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { changeJobStatusAction } from "@/app/jobs/actions";
import type { JobStatus } from "@/lib/jobs";

/** A dedicated shortcut to the status control's "Cancelled" option — added
 * because Delete is blocked the moment a job has any stock movements
 * against it (or any other related record), and Cancel is the intended
 * path for "this job shouldn't have gone ahead" instead. Cancelling a job
 * that already deducted SportCraft stock reverses that deduction (see
 * changeJobStatus in src/lib/jobs.ts) — the job itself is never deleted,
 * only its status changes, so its history stays on file. */
export function CancelJobButton({ jobId, status }: { jobId: string; status: JobStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status === "cancelled") return null;

  const stockConsumed = status === "completed" || status === "collected";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          const message = stockConsumed
            ? "Cancel this job? Any SportCraft stock already deducted for it will be added back to inventory. The job itself isn't deleted — its history stays on file."
            : "Cancel this job? It isn't deleted — its history stays on file, marked cancelled.";
          if (!confirm(message)) return;
          startTransition(async () => {
            const result = await changeJobStatusAction(jobId, "cancelled");
            if (!result.ok) {
              setError("Could not cancel this job.");
              return;
            }
            setError(null);
            router.refresh();
          });
        }}
      >
        {pending ? "Cancelling…" : "Cancel job"}
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
    </div>
  );
}
