"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { deleteRacketAction } from "@/app/customers/racket-actions";

/** Permanent delete — separate from ArchiveRacketButton, and deliberately
 * more friction: an inline warning panel plus a native confirm() before the
 * request even fires, since unlike archiving this can't be undone. */
export function DeleteRacketButton({ customerId, racketId }: { customerId: string; racketId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="form-danger" style={{ maxWidth: 440 }}>
        <p>
          <strong>Delete this racket permanently?</strong> This removes the racket and its measured data (grip size, weight, swingweight, balance, notes) for good — it cannot be undone. If you just want it out of the way, cancel and archive it instead.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Really delete this racket permanently? This cannot be undone.")) return;
              startTransition(async () => {
                const result = await deleteRacketAction(customerId, racketId);
                if (result.status === "deleted") {
                  router.push(`/customers/${customerId}`);
                } else {
                  setError(result.message ?? "Could not delete this racket.");
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
        Delete racket
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
    </div>
  );
}
