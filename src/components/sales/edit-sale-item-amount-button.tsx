"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { updateSaleItemAmountAction } from "@/app/sales/actions";
import { formatCents } from "@/lib/format";

/** Corrects a mistyped unit price or discount on an already-completed sale
 * item — reserved for a genuine data-entry mistake (brief-style deliberate
 * exception, same reasoning as Edit batch for inventory batches), not an
 * ordinary edit. Quantity and COGS never change here — only what the
 * customer was charged. Requires a reason, kept on the Sale's own notes as
 * the audit trail (sales have no dedicated audit log the way expenses do). */
export function EditSaleItemAmountButton({ saleItemId, quantity, unitPriceCents, discountCents }: { saleItemId: string; quantity: number; unitPriceCents: number; discountCents: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState((unitPriceCents / 100).toFixed(2));
  const [discount, setDiscount] = useState((discountCents / 100).toFixed(2));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit amount
      </Button>
    );
  }

  const priceCents = Math.round((Number.parseFloat(price) || 0) * 100);
  const discountCentsValue = Math.round((Number.parseFloat(discount) || 0) * 100);
  const previewLineTotalCents = Math.max(0, priceCents * quantity - discountCentsValue);

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <Field label="Unit price">
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
      </Field>
      <Field label="Discount" hint="Optional — a flat amount off this line">
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
      </Field>
      <div className="row-s num">New line total: {formatCents(previewLineTotalCents)}</div>
      <Field label="Reason" required>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. mistyped the price at checkout" style={{ width: "100%" }} />
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          disabled={saving || !reason.trim()}
          onClick={async () => {
            setSaving(true);
            setError(null);
            const result = await updateSaleItemAmountAction({ saleItemId, unitPriceCents: priceCents, discountCents: discountCentsValue, reason });
            setSaving(false);
            if (!result.ok) {
              setError("This is a return record, not an ordinary charge — its amount can't be edited.");
              return;
            }
            setOpen(false);
            router.refresh();
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
