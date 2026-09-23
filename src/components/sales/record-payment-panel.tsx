"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { recordPaymentAction } from "@/app/sales/actions";
import type { PaymentMethod } from "@/lib/sales";
import { formatCents } from "@/lib/format";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "paynow", label: "PayNow" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

/** Split-payment ready (brief §24) — every click here just appends another
 * sale_payments row; the Sale's own paymentStatus is recomputed from the
 * sum, so "$20 PayNow now, $15 Cash later" naturally lands on Paid once
 * both exist. */
export function RecordPaymentPanel({ saleId, balanceDueCents }: { saleId: string; balanceDueCents: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((balanceDueCents / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("paynow");
  const [saving, setSaving] = useState(false);

  if (balanceDueCents <= 0) return null;

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Record payment
      </Button>
    );
  }

  return (
    <Card tone="sunken" padding="16px" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 360 }}>
      <div className="lab">Record payment · balance due {formatCents(balanceDueCents)}</div>
      <Field label="Amount" htmlFor="payAmount">
        <Input id="payAmount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
      </Field>
      <Field label="Method">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          disabled={saving || !amount.trim() || Number(amount) <= 0}
          onClick={async () => {
            setSaving(true);
            await recordPaymentAction(saleId, Math.round(Number.parseFloat(amount) * 100), method);
            setSaving(false);
            setOpen(false);
            router.refresh();
          }}
        >
          {saving ? "Saving…" : "Save payment"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
