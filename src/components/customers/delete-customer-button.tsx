"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { deleteCustomerAction } from "@/app/customers/actions";

/** Permanent delete — separate from ArchiveCustomerButton, and deliberately
 * more friction: an inline warning panel plus a native confirm() before the
 * request even fires, since unlike archiving this can't be undone. */
export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="form-danger" style={{ maxWidth: 440 }}>
        <p>
          <strong>Delete this customer permanently?</strong> This removes the customer record for good — it cannot be undone. If they have any rackets, string jobs or sales on file, this will fail; archive the customer instead if you just want them out of the way.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Really delete this customer permanently? This cannot be undone.")) return;
              startTransition(async () => {
                const result = await deleteCustomerAction(customerId);
                if (result.status === "deleted") {
                  router.push("/customers");
                } else {
                  setError(result.message ?? "Could not delete this customer.");
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
        Delete customer
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
    </div>
  );
}
