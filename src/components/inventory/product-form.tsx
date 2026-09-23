"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { createStringProductAction, updateStringProductAction } from "@/app/inventory/actions";
import type { StringProduct, StockUnit } from "@/lib/string-inventory";

export function ProductForm({ mode, product }: { mode: "create" | "edit"; product?: StringProduct }) {
  const router = useRouter();
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [gauge, setGauge] = useState(product?.gauge ?? "");
  const [colour, setColour] = useState(product?.colour ?? "");
  const [material, setMaterial] = useState(product?.material ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [trackingUnit, setTrackingUnit] = useState<StockUnit>(product?.trackingUnit ?? "m");
  const [defaultSellingPrice, setDefaultSellingPrice] = useState(product?.defaultSellingPriceCents != null ? (product.defaultSellingPriceCents / 100).toFixed(2) : "");
  const [reelLengthM, setReelLengthM] = useState(product?.reelLengthM ?? "");
  const [reelSellingPrice, setReelSellingPrice] = useState(product?.reelSellingPriceCents != null ? (product.reelSellingPriceCents / 100).toFixed(2) : "");
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold ?? "");
  const [notes, setNotes] = useState(product?.notes ?? "");

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(allowDuplicate: boolean) {
    setSaving(true);
    const input = {
      brand,
      name,
      gauge: gauge || null,
      colour: colour || null,
      material: material || null,
      sku: sku || null,
      trackingUnit,
      defaultSellingPriceCents: defaultSellingPrice.trim() ? Math.round(Number.parseFloat(defaultSellingPrice) * 100) : null,
      reelLengthM: reelLengthM || null,
      reelSellingPriceCents: reelSellingPrice.trim() ? Math.round(Number.parseFloat(reelSellingPrice) * 100) : null,
      lowStockThreshold: lowStockThreshold || null,
      notes: notes || null,
    };
    const result = mode === "create" ? await createStringProductAction(input, allowDuplicate) : await updateStringProductAction(product!.id, input, allowDuplicate);
    if (result.status === "duplicate") {
      setDuplicateWarning(`A similar string already exists: ${result.duplicateLabel}.`);
      setSaving(false);
      return;
    }
    router.push(`/inventory/products/${result.productId}`);
  }

  return (
    <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      {duplicateWarning ? (
        <div className="form-warning">
          <p>{duplicateWarning}</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => save(true)} disabled={saving}>
            Save anyway
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
      <div className="form-grid">
        <Field label="Material" hint="Optional">
          <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Co-polyester" style={{ width: "100%" }} />
        </Field>
        <Field label="SKU" hint="Optional">
          <Input value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: "100%" }} />
        </Field>
      </div>
      <Field label="Sold as">
        <div className="tabs-lite" role="tablist">
          <button type="button" className={"tab-lite" + (trackingUnit === "m" ? " on" : "")} onClick={() => setTrackingUnit("m")}>
            Reels (metres)
          </button>
          <button type="button" className={"tab-lite" + (trackingUnit === "set" ? " on" : "")} onClick={() => setTrackingUnit("set")}>
            Sets
          </button>
        </div>
      </Field>
      <div className="form-grid">
        <Field label="Default selling price" hint={trackingUnit === "m" ? "Optional — per metre, for cut-to-length sales" : "Optional"} htmlFor="dsp">
          <Input id="dsp" type="number" inputMode="decimal" min="0" step="0.01" value={defaultSellingPrice} onChange={(e) => setDefaultSellingPrice(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
        <Field label="Low stock threshold" hint={`Optional — falls back to the Settings default`} htmlFor="lst">
          <Input id="lst" type="number" inputMode="decimal" min="0" step="0.1" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} suffix={trackingUnit === "set" ? "sets" : "m"} style={{ width: "100%" }} />
        </Field>
      </div>
      {trackingUnit === "m" ? (
        <div className="form-grid">
          <Field label="Reel length" hint="Optional — how many metres come on one reel. Set this to let the POS sell a whole, uncut reel as its own item." htmlFor="reelLength">
            <Input id="reelLength" type="number" inputMode="decimal" min="0" step="0.01" value={reelLengthM} onChange={(e) => setReelLengthM(e.target.value)} suffix="m" style={{ width: "100%" }} />
          </Field>
          <Field label="Reel selling price" hint="Optional — flat price for a whole reel, separate from the per-metre price above" htmlFor="reelPrice">
            <Input id="reelPrice" type="number" inputMode="decimal" min="0" step="0.01" value={reelSellingPrice} onChange={(e) => setReelSellingPrice(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
          </Field>
        </div>
      ) : null}
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="button" disabled={saving || !brand.trim() || !name.trim()} onClick={() => save(false)}>
        {saving ? "Saving…" : mode === "create" ? "Save string" : "Save changes"}
      </Button>
    </Card>
  );
}
