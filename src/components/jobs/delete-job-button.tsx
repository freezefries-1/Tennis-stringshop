"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { deleteJobAction } from "@/app/jobs/actions";

/** Permanent delete — separate from the status control's "Cancelled" state,
 * and deliberately more friction, same pattern as delete-racket-button.tsx /
 * delete-model-button.tsx. */
export function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="form-danger" style={{ maxWidth: 440 }}>
        <p>
          <strong>Delete this job permanently?</strong> This removes the job and its string/service records for good — it cannot be undone. If this job did go ahead, cancel it instead of deleting it.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Really delete this job permanently? This cannot be undone.")) return;
              startTransition(async () => {
                const result = await deleteJobAction(jobId);
                if (result.status === "deleted") {
                  router.push("/jobs");
                } else {
                  setError(result.message ?? "Could not delete this job.");
                  setConfirming(false);
                }
              });
            }}
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <Button
        size="sm"
        variant="ghost"
        iconLeft="trash"
        style={{ color: "var(--signal-danger)" }}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Delete job
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
    </div>
  );
}
