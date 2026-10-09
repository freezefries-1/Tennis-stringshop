"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { removeSaleItemAction } from "@/app/sales/actions";

/** Removes a line added by mistake on an unpaid sale — a straight delete
 * plus a stock reversal, not a Return (no money has moved, so there's
 * nothing to refund). Only offered while the sale is unpaid and nothing on
 * this specific line has been returned yet — see removeSaleItem for why. */
export function RemoveSaleItemButton({ saleItemId, itemType, paymentStatus, returnedQuantity }: { saleItemId: string; itemType: string; paymentStatus: string; returnedQuantity: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (itemType === "string_job_service" || paymentStatus !== "unpaid" || returnedQuantity > 0) return null;

  if (!open) {
    return (
      <Button size="sm" variant="ghost" style={{ color: "var(--signal-danger)" }} onClick={() => setOpen(true)}>
        Remove
      </Button>
    );
  }

  return (
    <div className="form-danger" style={{ maxWidth: 300, display: "flex", flexDirection: "column", gap: 8 }}>
      <p>
        <strong>Remove this item?</strong> Any stock allocated to it is restocked.
      </p>
      {error ? <p style={{ color: "var(--signal-danger)", fontSize: 13 }}>{error}</p> : null}
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for removing"
        style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 14 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          variant="danger"
          disabled={saving || !reason.trim()}
          onClick={async () => {
            setSaving(true);
            setError(null);
            const result = await removeSaleItemAction(saleItemId, reason);
            setSaving(false);
            if (!result.ok) {
              setError(
                result.reason === "already_returned"
                  ? "Part of this item has already been returned — it can't be removed outright."
                  : result.reason === "sale_locked"
                    ? "This sale already has a payment — use Return instead."
                    : result.reason === "job_service_line"
                      ? "This line comes from the job's own services — edit the job instead."
                      : "This item can't be removed.",
              );
              return;
            }
            router.refresh();
          }}
        >
          {saving ? "Removing…" : "Confirm remove"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </div>
  );
}
