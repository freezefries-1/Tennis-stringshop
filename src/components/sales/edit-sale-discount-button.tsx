"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { updateSaleDiscountAction } from "@/app/sales/actions";
import { formatCents } from "@/lib/format";
import type { DiscountType } from "@/lib/sales";

/** Corrects the whole-sale discount entered at checkout — e.g. $2.50 typed
 * instead of $0.50 — the same deliberate, audited exception as Edit amount
 * on a line item. Not offered on a job-linked sale (stringJobId set) or a
 * reversal sale; see updateSaleDiscount for why. */
export function EditSaleDiscountButton({
  saleId,
  subtotalCents,
  discountType,
  discountValue,
  stringJobLinked,
  isReversal,
}: {
  saleId: string;
  subtotalCents: number;
  discountType: DiscountType | null;
  discountValue: string | null;
  stringJobLinked: boolean;
  isReversal: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DiscountType | "">(discountType ?? "");
  const [value, setValue] = useState(discountValue ?? "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (stringJobLinked || isReversal) return null;

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit discount
      </Button>
    );
  }

  const v = Number.parseFloat(value) || 0;
  const previewDiscountCents = !type || !value.trim() ? 0 : Math.max(0, Math.min(type === "percent" ? Math.round(subtotalCents * (v / 100)) : Math.round(v * 100), subtotalCents));

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
        <Field label="Type" style={{ width: 140, minWidth: 0 }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DiscountType | "")}
            style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
          >
            <option value="">No discount</option>
            <option value="fixed">Fixed amount</option>
            <option value="percent">Percent</option>
          </select>
        </Field>
        {type ? (
          <Field label={type === "percent" ? "Percent" : "Amount"} style={{ width: 100, minWidth: 0 }}>
            <Input type="number" inputMode="decimal" min="0" step={type === "percent" ? "1" : "0.01"} value={value} onChange={(e) => setValue(e.target.value)} suffix={type === "percent" ? "%" : "SGD"} style={{ width: "100%", minWidth: 0 }} />
          </Field>
        ) : null}
      </div>
      <div className="row-s num">New discount: −{formatCents(previewDiscountCents)}</div>
      <Field label="Reason" required>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. meant to type 0.50, typed 2.50" style={{ width: "100%" }} />
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          disabled={saving || !reason.trim()}
          onClick={async () => {
            setSaving(true);
            setError(null);
            const result = await updateSaleDiscountAction(saleId, type || null, type ? v : null, reason);
            setSaving(false);
            if (!result.ok) {
              setError(result.reason === "job_linked" ? "This sale is linked to a string job — its discount comes from the job. Fix the job's discount instead." : "This is a return record — its discount can't be edited.");
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
