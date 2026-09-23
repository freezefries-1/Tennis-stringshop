"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Combobox } from "@/components/ds/combobox";
import { createProductAction, updateProductAction, quickCreateSupplierAction } from "@/app/products/actions";
import type { Product, ProductCategory } from "@/lib/products";
import type { Supplier } from "@/lib/string-inventory";

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 15, width: "100%" };
}

export function ProductForm({ mode, product, categories, suppliers: initialSuppliers }: { mode: "create" | "edit"; product?: Product; categories: ProductCategory[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [variant, setVariant] = useState(product?.variant ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [defaultSellingPrice, setDefaultSellingPrice] = useState(product?.defaultSellingPriceCents != null ? (product.defaultSellingPriceCents / 100).toFixed(2) : "");
  const [costPrice, setCostPrice] = useState(product?.costPriceCents != null ? (product.costPriceCents / 100).toFixed(2) : "");
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold != null ? String(product.lowStockThreshold) : "");
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [supplier, setSupplier] = useState<Supplier | null>(initialSuppliers.find((s) => s.id === product?.supplierId) ?? null);
  const [trackInventory, setTrackInventory] = useState(product?.trackInventory ?? true);
  const [notes, setNotes] = useState(product?.notes ?? "");

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(allowDuplicate: boolean) {
    setSaving(true);
    const input = {
      name,
      brand: brand || null,
      categoryId,
      variant: variant || null,
      sku: sku || null,
      barcode: barcode || null,
      defaultSellingPriceCents: defaultSellingPrice.trim() ? Math.round(Number.parseFloat(defaultSellingPrice) * 100) : null,
      costPriceCents: costPrice.trim() ? Math.round(Number.parseFloat(costPrice) * 100) : null,
      lowStockThreshold: lowStockThreshold.trim() ? Math.round(Number.parseFloat(lowStockThreshold)) : null,
      supplierId: supplier?.id ?? null,
      trackInventory,
      notes: notes || null,
    };
    const result = mode === "create" ? await createProductAction(input, allowDuplicate) : await updateProductAction(product!.id, input, allowDuplicate);
    if (result.status === "duplicate") {
      setDuplicateWarning(`A similar product already exists: ${result.duplicateLabel}.`);
      setSaving(false);
      return;
    }
    if (mode === "create" && trackInventory) {
      router.push(`/products/receive?productId=${result.productId}`);
    } else {
      router.push(`/products/${result.productId}`);
    }
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
        <Field label="Brand" hint="Optional">
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Wilson" style={{ width: "100%" }} />
        </Field>
        <Field label="Product name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro Overgrip" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Category" required>
          {categories.length === 0 ? (
            <span className="row-s">
              <Link href="/products/categories" style={{ color: "var(--court-600)" }}>
                Add a category first
              </Link>
            </span>
          ) : (
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={selectStyle()}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Variant" hint="Optional — colour, size, ...">
          <Input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="White" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="SKU" hint="Optional">
          <Input value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="Barcode" hint="Optional">
          <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Selling price" hint="Optional" htmlFor="dsp">
          <Input id="dsp" type="number" inputMode="decimal" min="0" step="0.01" value={defaultSellingPrice} onChange={(e) => setDefaultSellingPrice(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
        <Field label="Cost price" hint={trackInventory ? "Optional — pre-fills the first stock receipt" : "Used as this product's COGS (no batches, since stock isn't tracked)"} htmlFor="cost">
          <Input id="cost" type="number" inputMode="decimal" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
      </div>
      <Field label="Track inventory">
        <div className="tabs-lite" role="tablist">
          <button type="button" className={"tab-lite" + (trackInventory ? " on" : "")} onClick={() => setTrackInventory(true)}>
            Yes — keep a stock count
          </button>
          <button type="button" className={"tab-lite" + (!trackInventory ? " on" : "")} onClick={() => setTrackInventory(false)}>
            No — always sellable
          </button>
        </div>
      </Field>
      {trackInventory ? (
        <div className="form-grid">
          <Field label="Low stock threshold" hint="Optional — falls back to the Settings default" htmlFor="lst">
            <Input id="lst" type="number" inputMode="numeric" min="0" step="1" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} suffix="units" style={{ width: "100%" }} />
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
      ) : null}
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="button" disabled={saving || !name.trim() || !categoryId} onClick={() => save(false)}>
        {saving ? "Saving…" : mode === "create" ? "Save product" : "Save changes"}
      </Button>
    </Card>
  );
}
