"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { deleteModelAction } from "@/app/catalogue/actions";

/** Permanent delete — separate from ArchiveModelButton, and deliberately
 * more friction: an inline warning panel plus a native confirm() before the
 * request even fires. Blocked server-side whenever any customer racket
 * (active or archived) still references the model. */
export function DeleteModelButton({ modelId }: { modelId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="form-danger" style={{ maxWidth: 440 }}>
        <p>
          <strong>Delete this racket model permanently?</strong> This removes it from the racket database for good — it cannot be undone. If any customer racket still uses it, the delete is blocked. If you just want it out of new-racket selection, cancel and archive it instead.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Really delete this racket model permanently? This cannot be undone.")) return;
              startTransition(async () => {
                const result = await deleteModelAction(modelId);
                if (result.status === "deleted") {
                  router.push("/catalogue");
                } else {
                  setError(result.message ?? "Could not delete this model.");
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
        Delete model
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)", maxWidth: 260, textAlign: "right" }}>{error}</span> : null}
    </div>
  );
}
