"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { recordManualAdjustmentAction, updateProductBatchCostAction } from "@/app/products/actions";
import type { ProductInventoryBatch } from "@/lib/products";

type AdjustmentMode = "manual_add" | "manual_deduct" | "wastage" | "correction" | "edit_cost";

const TITLE: Record<AdjustmentMode, string> = {
  manual_add: "Add stock",
  manual_deduct: "Deduct stock",
  wastage: "Record wastage",
  correction: "Stock correction",
  edit_cost: "Edit purchase cost",
};
const REASON_PLACEHOLDER: Record<AdjustmentMode, string> = {
  manual_add: "e.g. found extra stock on a re-count",
  manual_deduct: "e.g. used for a demo",
  wastage: "e.g. damaged in storage",
  correction: "e.g. physical stocktake",
  edit_cost: "e.g. supplier invoice was entered wrong",
};

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

/** Every path here writes one ledger movement with a required reason
 * (brief §6) — never a silent change to remainingQuantity. Same pattern as
 * src/components/inventory/adjust-stock-panel.tsx (string products). */
export function AdjustStockPanel({ productId, batches }: { productId: string; batches: ProductInventoryBatch[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<AdjustmentMode | null>(null);
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costForBatch = (id: string) => {
    const b = batches.find((x) => x.id === id);
    return b ? (b.purchaseCostCents / 100).toFixed(2) : "";
  };

  const openPanel = (mode: AdjustmentMode) => {
    setOpen(mode);
    setAmount("");
    setReason("");
    setError(null);
    const id = batchId || batches[0]?.id || "";
    if (!batchId && batches[0]) setBatchId(batches[0].id);
    if (mode === "edit_cost") setCost(costForBatch(id));
  };

  function selectBatch(id: string) {
    setBatchId(id);
    if (open === "edit_cost") setCost(costForBatch(id));
  }

  async function submit() {
    if (!open) return;
    if (open === "edit_cost") {
      const cents = Math.round(Number(cost) * 100);
      if (!batchId || !cost.trim() || Number.isNaN(cents) || cents < 0 || !reason.trim()) {
        setError("Batch, purchase cost and reason are all required.");
        return;
      }
      setSaving(true);
      setError(null);
      await updateProductBatchCostAction({ batchId, purchaseCostCents: cents, reason }, productId);
      setSaving(false);
      setOpen(null);
      router.refresh();
      return;
    }
    if (!batchId || !amount.trim() || !reason.trim()) {
      setError("Batch, amount and reason are all required.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await recordManualAdjustmentAction({ batchId, type: open, amount: Math.round(Number(amount)), reason }, productId);
    setSaving(false);
    if (result.status === "insufficient_stock") {
      setError(`Only ${result.available} remaining on this batch — can't deduct ${result.needed}.`);
      return;
    }
    setOpen(null);
    router.refresh();
  }

  if (batches.length === 0) {
    return <div className="row-s">Receive stock first to enable manual adjustments.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" variant="secondary" onClick={() => openPanel("manual_add")}>
          Add stock
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openPanel("manual_deduct")}>
          Deduct stock
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openPanel("wastage")}>
          Record wastage
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openPanel("correction")}>
          Stock correction
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openPanel("edit_cost")}>
          Edit purchase cost
        </Button>
      </div>

      {open ? (
        <Card tone="sunken" padding="16px" style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420 }}>
          <div className="lab">{TITLE[open]}</div>
          {error ? (
            <div className="form-warning">
              <p>{error}</p>
            </div>
          ) : null}
          <Field label="Batch">
            <select value={batchId} onChange={(e) => selectBatch(e.target.value)} style={selectStyle()}>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} — {b.remainingQuantity} remaining
                </option>
              ))}
            </select>
          </Field>
          {open === "edit_cost" ? (
            <Field label="Purchase cost" htmlFor="adjCost">
              <Input id="adjCost" type="number" inputMode="decimal" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
            </Field>
          ) : (
            <Field label={open === "correction" ? "Correct remaining stock to" : "Amount"} htmlFor="adjAmount">
              <Input id="adjAmount" type="number" inputMode="numeric" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="units" style={{ width: "100%" }} />
            </Field>
          )}
          <Field label="Reason" htmlFor="adjReason" required>
            <Input id="adjReason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={REASON_PLACEHOLDER[open]} style={{ width: "100%" }} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" disabled={saving} onClick={submit}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(null)}>
              Cancel
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
