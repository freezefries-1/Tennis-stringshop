"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { returnSaleItemAction } from "@/app/sales/actions";
import { formatCents } from "@/lib/format";

/** Partial-return capable (brief §33/§34) — quantity, refund amount and a
 * restock toggle for a non-resellable/damaged item (brief §35), all in one
 * small panel per line rather than a separate returns workflow. */
export function ReturnItemPanel({ saleItemId, outstandingQty, unitPriceCents }: { saleItemId: string; outstandingQty: number; unitPriceCents: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(String(outstandingQty));
  const [refund, setRefund] = useState(((Number(outstandingQty) || 0) * unitPriceCents / 100).toFixed(2));
  const [restock, setRestock] = useState(true);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (outstandingQty <= 0) return <span className="row-s">Fully returned</span>;

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Return
      </Button>
    );
  }

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <Field label="Quantity to return">
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          max={outstandingQty}
          step="0.01"
          value={quantity}
          onChange={(e) => {
            setQuantity(e.target.value);
            setRefund(((Number(e.target.value) || 0) * unitPriceCents / 100).toFixed(2));
          }}
          style={{ width: "100%" }}
        />
      </Field>
      <Field label="Refund amount">
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={refund} onChange={(e) => setRefund(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} />
        Restock (uncheck for damaged/non-resellable)
      </label>
      <Field label="Reason">
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. unopened, customer changed mind" style={{ width: "100%" }} />
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          disabled={saving || !reason.trim() || Number(quantity) <= 0}
          onClick={async () => {
            setSaving(true);
            setError(null);
            const result = await returnSaleItemAction({
              saleItemId,
              quantity: Number(quantity),
              refundCents: Math.round((Number.parseFloat(refund) || 0) * 100),
              reason,
              restock,
            });
            setSaving(false);
            if (!result.ok) {
              setError("That quantity exceeds what's left to return.");
              return;
            }
            setOpen(false);
            router.refresh();
          }}
        >
          {saving ? "Saving…" : formatCents(Math.round((Number.parseFloat(refund) || 0) * 100)) + " refund"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
