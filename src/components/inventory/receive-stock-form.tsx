"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Combobox } from "@/components/ds/combobox";
import { formatCents } from "@/lib/format";
import { createStringProductAction, quickCreateSupplierAction, receiveStockAction } from "@/app/inventory/actions";
import type { StringProductRow, Supplier, StockUnit } from "@/lib/string-inventory";

const TODAY = new Date().toISOString().slice(0, 10);

function productOptionLabel(p: StringProductRow): string {
  const base = [p.brand, p.name, p.gauge ? `${p.gauge}mm` : null, p.colour].filter(Boolean).join(" ");
  // The same brand+name is sometimes tracked twice — once as reels, once as
  // sets (a product's trackingUnit can't mix both, see schema.ts) — so the
  // unit has to be part of the label itself, not a separate badge, since
  // this reuses the generic Combobox (label-string only, no secondary line)
  // and its selected-chip view renders straight off this same string.
  return `${base} — ${p.trackingUnit === "set" ? "Set" : "Reel"}`;
}

export function ReceiveStockForm({ products, suppliers: initialSuppliers, initialProductId }: { products: StringProductRow[]; suppliers: Supplier[]; initialProductId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"existing" | "new">(initialProductId ? "existing" : products.length ? "existing" : "new");
  const [existingProduct, setExistingProduct] = useState<StringProductRow | null>(products.find((p) => p.id === initialProductId) ?? null);

  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [gauge, setGauge] = useState("");
  const [colour, setColour] = useState("");
  const [material, setMaterial] = useState("");
  const [newTrackingUnit, setNewTrackingUnit] = useState<StockUnit>("m");

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const [purchaseDate, setPurchaseDate] = useState(TODAY);
  const [quantity, setQuantity] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isOpeningStock, setIsOpeningStock] = useState(false);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackingUnit: StockUnit = mode === "existing" ? existingProduct?.trackingUnit ?? "m" : newTrackingUnit;
  const costPerUnitCents = useMemo(() => {
    const qty = Number(quantity);
    const cost = Math.round((Number.parseFloat(purchaseCost) || 0) * 100);
    return qty > 0 ? cost / qty : 0;
  }, [quantity, purchaseCost]);

  const canSave = mode === "existing" ? !!existingProduct : brand.trim() && name.trim();
  const canSubmit = canSave && quantity.trim() && Number(quantity) > 0 && purchaseCost.trim();

  async function doSave(allowDuplicate: boolean) {
    setSaving(true);
    setError(null);
    try {
      let productId = existingProduct?.id ?? null;
      if (mode === "new") {
        const result = await createStringProductAction({ brand, name, gauge: gauge || null, colour: colour || null, material: material || null, trackingUnit: newTrackingUnit }, allowDuplicate);
        if (result.status === "duplicate") {
          setDuplicateWarning(`A similar string already exists: ${result.duplicateLabel}.`);
          setSaving(false);
          return;
        }
        productId = result.productId!;
      }
      if (!productId) {
        setError("Select or create a string product first.");
        setSaving(false);
        return;
      }
      await receiveStockAction({
        stringProductId: productId,
        supplierId: supplier?.id ?? null,
        purchaseDate,
        purchaseCostCents: Math.round((Number.parseFloat(purchaseCost) || 0) * 100),
        quantity,
        unit: trackingUnit,
        supplierReference: supplierReference || null,
        notes: notes || null,
        isOpeningStock,
      });
      router.push(`/inventory/products/${productId}`);
    } catch {
      setError("Something went wrong saving this receipt. Try again.");
      setSaving(false);
    }
  }

  return (
    <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {error ? (
        <div className="form-warning">
          <p>{error}</p>
        </div>
      ) : null}

      <div>
        <div className="lab" style={{ marginBottom: 8 }}>
          String product
        </div>
        <div className="tabs-lite" role="tablist">
          <button type="button" className={"tab-lite" + (mode === "existing" ? " on" : "")} onClick={() => setMode("existing")}>
            Existing product
          </button>
          <button type="button" className={"tab-lite" + (mode === "new" ? " on" : "")} onClick={() => setMode("new")}>
            Create new product
          </button>
        </div>
      </div>

      {mode === "existing" ? (
        <Combobox
          label="String"
          placeholder="Search brand, string, gauge, colour…"
          options={products}
          getLabel={productOptionLabel}
          getKey={(p) => p.id}
          selected={existingProduct}
          onSelect={setExistingProduct}
          addNewLabel="Switch to creating"
          onAddNew={() => setMode("new")}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {duplicateWarning ? (
            <div className="form-warning">
              <p>{duplicateWarning}</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => doSave(true)} disabled={saving}>
                Save as a new product anyway
              </Button>
            </div>
          ) : null}
          <div className="form-grid">
            <Field label="Brand">
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Solinco" style={{ width: "100%" }} />
            </Field>
            <Field label="String">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hyper-G" style={{ width: "100%" }} />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Gauge (mm)">
              <Input value={gauge} onChange={(e) => setGauge(e.target.value)} placeholder="1.25" style={{ width: "100%" }} />
            </Field>
            <Field label="Colour">
              <Input value={colour} onChange={(e) => setColour(e.target.value)} placeholder="Green" style={{ width: "100%" }} />
            </Field>
          </div>
          <Field label="Material" hint="Optional — polyester, multifilament, gut, ...">
            <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Co-polyester" style={{ width: "100%" }} />
          </Field>
          <Field label="Sold as">
            <div className="tabs-lite" role="tablist">
              <button type="button" className={"tab-lite" + (newTrackingUnit === "m" ? " on" : "")} onClick={() => setNewTrackingUnit("m")}>
                Reels (metres)
              </button>
              <button type="button" className={"tab-lite" + (newTrackingUnit === "set" ? " on" : "")} onClick={() => setNewTrackingUnit("set")}>
                Sets
              </button>
            </div>
          </Field>
        </div>
      )}

      <div className="form-grid">
        <Field label="Purchase date" htmlFor="purchaseDate">
          <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} style={{ width: "100%" }} />
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
      </div>

      <div className="form-grid">
        <Field label={trackingUnit === "set" ? "Number of sets" : "Starting length"} htmlFor="quantity">
          <Input id="quantity" type="number" inputMode="decimal" min="0" step={trackingUnit === "set" ? "1" : "0.1"} value={quantity} onChange={(e) => setQuantity(e.target.value)} suffix={trackingUnit === "set" ? "sets" : "m"} style={{ width: "100%" }} />
        </Field>
        <Field label="Purchase cost" htmlFor="purchaseCost">
          <Input id="purchaseCost" type="number" inputMode="decimal" min="0" step="0.01" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
      </div>

      {quantity && purchaseCost ? (
        <div className="row-s num">
          Cost per {trackingUnit === "set" ? "set" : "metre"}: {formatCents(costPerUnitCents)}
        </div>
      ) : null}

      <Field label="Supplier reference" htmlFor="supplierReference" hint="Optional — invoice or order number">
        <Input id="supplierReference" value={supplierReference} onChange={(e) => setSupplierReference(e.target.value)} style={{ width: "100%" }} />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--ink-600)" }}>
        <input type="checkbox" checked={isOpeningStock} onChange={(e) => setIsOpeningStock(e.target.checked)} />
        This is opening inventory (existing stock I&rsquo;m entering to get started, not a new purchase)
      </label>

      <Button type="button" disabled={!canSubmit || saving} onClick={() => doSave(false)}>
        {saving ? "Saving…" : "Receive stock"}
      </Button>
    </Card>
  );
}
