"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { cancelSaleAction } from "@/app/sales/actions";

/** Only offered while the Sale is unpaid (brief §32) — once anything has
 * been paid, use Return/Refund instead so the refund itself stays on the
 * audit trail. The Sale record itself is never deleted either way. */
export function CancelSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="ghost" style={{ color: "var(--signal-danger)" }} onClick={() => setOpen(true)}>
        Cancel sale
      </Button>
    );
  }

  return (
    <div className="form-danger" style={{ maxWidth: 360, display: "flex", flexDirection: "column", gap: 8 }}>
      <p>
        <strong>Cancel this sale?</strong> Inventory is restocked and the record is kept, marked cancelled — it is never deleted.
      </p>
      {error ? <p style={{ color: "var(--signal-danger)", fontSize: 13 }}>{error}</p> : null}
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for cancelling"
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
            const result = await cancelSaleAction(saleId, reason);
            setSaving(false);
            if (!result.ok) {
              setError(result.reason === "already_paid" ? "This sale already has a payment recorded — use Return/Refund instead." : "This sale can't be cancelled.");
              return;
            }
            router.refresh();
          }}
        >
          {saving ? "Cancelling…" : "Confirm cancel"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </div>
  );
}
