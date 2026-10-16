"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { updateSalePaymentAmountAction } from "@/app/sales/actions";

/** Corrects a mistyped payment amount — reserved for a genuine data-entry
 * mistake, same reasoning as EditSaleItemAmountButton. Requires a reason,
 * kept on the Sale's own notes as the audit trail (sales have no dedicated
 * audit log the way expenses do). paymentStatus is always recomputed from
 * the sum, so a typo that left a Sale stuck on "Partially paid" resolves
 * back to "Paid" on its own once the real amount is saved. */
export function EditSalePaymentAmountButton({ paymentId, amountCents }: { paymentId: string; amountCents: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((amountCents / 100).toFixed(2));
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

  const amountCentsValue = Math.round((Number.parseFloat(amount) || 0) * 100);

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <Field label="Amount">
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
      </Field>
      <Field label="Reason" required>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. mistyped the amount" style={{ width: "100%" }} />
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          disabled={saving || !reason.trim() || amountCentsValue <= 0}
          onClick={async () => {
            setSaving(true);
            setError(null);
            const result = await updateSalePaymentAmountAction({ paymentId, amountCents: amountCentsValue, reason });
            setSaving(false);
            if (!result.ok) {
              setError("This is a return record, not an ordinary charge — its payments can't be edited.");
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
