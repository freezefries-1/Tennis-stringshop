"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Combobox } from "@/components/ds/combobox";
import { recordManualAdjustmentAction, updateBatchCostAction, quickCreateSupplierAction } from "@/app/inventory/actions";
import type { StringInventoryBatch, StockUnit, Supplier } from "@/lib/string-inventory";

type AdjustmentMode = "manual_add" | "manual_deduct" | "wastage" | "correction" | "edit_batch";

const TITLE: Record<AdjustmentMode, string> = {
  manual_add: "Add stock",
  manual_deduct: "Deduct stock",
  wastage: "Record wastage",
  correction: "Stock correction",
  edit_batch: "Edit batch",
};
const REASON_PLACEHOLDER: Record<AdjustmentMode, string> = {
  manual_add: "e.g. found extra stock on a re-count",
  manual_deduct: "e.g. used for a demo racket",
  wastage: "e.g. string snapped during stringing",
  correction: "e.g. physical stocktake",
  edit_batch: "e.g. mis-typed when receiving this batch",
};

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

/** Every path here writes one ledger movement with a required reason
 * (brief §21) — never a silent change to remainingQuantity. "Edit batch"
 * is the one exception to "movement per action": pure metadata fields
 * (date/supplier/reference/notes) never touch the ledger — only an
 * original-quantity or cost change does. */
export function AdjustStockPanel({ productId, batches, unit, suppliers: initialSuppliers }: { productId: string; batches: StringInventoryBatch[]; unit: StockUnit; suppliers: Supplier[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<AdjustmentMode | null>(null);
  const [batchId, setBatchId] = useState(batches[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [receivedQty, setReceivedQty] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierReference, setSupplierReference] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batchById = (id: string) => batches.find((x) => x.id === id);

  const loadBatchIntoEditFields = (id: string) => {
    const b = batchById(id);
    if (!b) return;
    setCost((b.purchaseCostCents / 100).toFixed(2));
    setReceivedQty(String(b.originalQuantity));
    setPurchaseDate(b.purchaseDate);
    setSupplier(suppliers.find((s) => s.id === b.supplierId) ?? null);
    setSupplierReference(b.supplierReference ?? "");
    setNotes(b.notes ?? "");
  };

  const openPanel = (mode: AdjustmentMode) => {
    setOpen(mode);
    setAmount("");
    setError(null);
    setReason("");
    const id = batchId || batches[0]?.id || "";
    if (!batchId && batches[0]) setBatchId(batches[0].id);
    if (mode === "edit_batch") loadBatchIntoEditFields(id);
  };

  function selectBatch(id: string) {
    setBatchId(id);
    if (open === "edit_batch") loadBatchIntoEditFields(id);
  }

  async function submit() {
    if (!open) return;
    if (open === "edit_batch") {
      const cents = Math.round(Number(cost) * 100);
      if (!batchId || !cost.trim() || Number.isNaN(cents) || cents < 0 || !receivedQty.trim() || Number(receivedQty) <= 0 || !purchaseDate || !reason.trim()) {
        setError("Batch, purchase date, received quantity, purchase cost and reason are all required.");
        return;
      }
      setSaving(true);
      setError(null);
      const result = await updateBatchCostAction(
        {
          batchId,
          purchaseCostCents: cents,
          originalQuantity: receivedQty,
          purchaseDate,
          supplierId: supplier?.id ?? null,
          supplierReference: supplierReference || null,
          notes: notes || null,
          reason,
        },
        productId,
      );
      setSaving(false);
      if (result.status === "invalid_quantity") {
        setError(`That would leave ${result.impliedRemaining}${unit === "set" ? " sets" : "m"} remaining, which isn't possible — some has already been used from this batch. Check the corrected quantity.`);
        return;
      }
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
    const result = await recordManualAdjustmentAction({ batchId, type: open, amount, reason }, productId);
    setSaving(false);
    if (result.status === "insufficient_stock") {
      setError(`Only ${result.available} ${unit === "set" ? "sets" : "m"} remaining on this batch — can't deduct ${result.needed}.`);
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
        <Button size="sm" variant="secondary" onClick={() => openPanel("edit_batch")}>
          Edit batch
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
                  {b.batchNumber} — {b.remainingQuantity}
                  {unit === "set" ? " sets" : "m"} remaining
                </option>
              ))}
            </select>
          </Field>
          {open === "edit_batch" ? (
            <>
              <Field label="Purchase date" htmlFor="adjDate">
                <Input id="adjDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} style={{ width: "100%" }} />
              </Field>
              <Combobox
                label="Supplier"
                placeholder="Search or add a supplier…"
                options={suppliers}
                getLabel={(s) => s.name}
                getKey={(s) => s.id}
                selected={supplier}
                onSelect={setSupplier}
                addNewLabel="Add supplier"
                onAddNew={async (q) => {
                  const created = await quickCreateSupplierAction(q);
                  setSuppliers((s) => [...s, created]);
                  setSupplier(created);
                }}
              />
              <Field label="Supplier reference" htmlFor="adjSupplierRef" hint="Optional — invoice or order number">
                <Input id="adjSupplierRef" value={supplierReference} onChange={(e) => setSupplierReference(e.target.value)} style={{ width: "100%" }} />
              </Field>
              <Field label="Received quantity" hint="Corrects the receipt itself — different from Stock correction, which only adjusts what's currently on hand" htmlFor="adjQty">
                <Input id="adjQty" type="number" inputMode="decimal" min="0.01" step="0.1" value={receivedQty} onChange={(e) => setReceivedQty(e.target.value)} suffix={unit === "set" ? "sets" : "m"} style={{ width: "100%" }} />
              </Field>
              <Field label="Purchase cost" hint="Total paid for this batch — cost per unit recalculates from this ÷ the quantity above" htmlFor="adjCost">
                <Input id="adjCost" type="number" inputMode="decimal" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
              </Field>
              <Field label="Notes" htmlFor="adjNotes">
                <textarea id="adjNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </>
          ) : (
            <Field label={open === "correction" ? "Correct remaining stock to" : "Amount"} htmlFor="adjAmount">
              <Input id="adjAmount" type="number" inputMode="decimal" min="0" step="0.1" value={amount} onChange={(e) => setAmount(e.target.value)} suffix={unit === "set" ? "sets" : "m"} style={{ width: "100%" }} />
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
