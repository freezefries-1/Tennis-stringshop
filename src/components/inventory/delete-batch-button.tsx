"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { deleteStringBatchAction } from "@/app/inventory/actions";

/** Permanent delete — reserved for a mistaken receipt (e.g. a batch
 * received twice by accident), same scope as DeleteProductButton but for
 * one batch instead of a whole product. Blocked server-side the moment
 * anything has actually been drawn from the batch; Edit batch (correct
 * quantity/cost) is the everyday path once that's true. */
export function DeleteBatchButton({ batchId, productId }: { batchId: string; productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="form-danger" style={{ maxWidth: 360 }}>
        <p>
          <strong>Delete this batch permanently?</strong> It cannot be undone. If any of it has been sold, used in a job, or otherwise adjusted, the delete is blocked — use Edit batch instead.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Really delete this batch permanently? This cannot be undone.")) return;
              startTransition(async () => {
                const result = await deleteStringBatchAction(batchId, productId);
                setConfirming(false);
                if (result.status === "deleted") {
                  router.refresh();
                } else {
                  setError("Some of this batch has been sold, used, or adjusted, so it can't be deleted — use Edit batch instead.");
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
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
        Delete
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)", maxWidth: 220, textAlign: "right" }}>{error}</span> : null}
    </div>
  );
}
