"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Combobox } from "@/components/ds/combobox";
import { formatCents } from "@/lib/format";
import { receiveProductStockAction, quickCreateSupplierAction } from "@/app/products/actions";
import type { ProductRow } from "@/lib/products";
import type { Supplier } from "@/lib/string-inventory";

const TODAY = new Date().toISOString().slice(0, 10);

function productOptionLabel(p: ProductRow): string {
  return [p.brand, p.name, p.variant].filter(Boolean).join(" ");
}

export function ReceiveProductStockForm({ products, suppliers: initialSuppliers, initialProductId }: { products: ProductRow[]; suppliers: Supplier[]; initialProductId?: string }) {
  const router = useRouter();
  const trackedProducts = products.filter((p) => p.trackInventory);
  const [product, setProduct] = useState<ProductRow | null>(trackedProducts.find((p) => p.id === initialProductId) ?? null);

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [supplier, setSupplier] = useState<Supplier | null>(null);

  const [purchaseDate, setPurchaseDate] = useState(TODAY);
  const [quantity, setQuantity] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [supplierReference, setSupplierReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isOpeningStock, setIsOpeningStock] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const costPerUnitCents = useMemo(() => {
    const qty = Number(quantity);
    const cost = Math.round((Number.parseFloat(purchaseCost) || 0) * 100);
    return qty > 0 ? cost / qty : 0;
  }, [quantity, purchaseCost]);

  const canSubmit = !!product && quantity.trim() && Number(quantity) > 0 && purchaseCost.trim();

  async function doSave() {
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      await receiveProductStockAction({
        productId: product.id,
        supplierId: supplier?.id ?? null,
        purchaseDate,
        purchaseCostCents: Math.round((Number.parseFloat(purchaseCost) || 0) * 100),
        quantity: Math.round(Number(quantity)),
        supplierReference: supplierReference || null,
        notes: notes || null,
        isOpeningStock,
      });
      router.push(`/products/${product.id}`);
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

      {trackedProducts.length === 0 ? (
        <div className="row-s">No inventory-tracked products yet — add one first.</div>
      ) : (
        <Combobox
          label="Product"
          placeholder="Search brand, name, variant…"
          options={trackedProducts}
          getLabel={productOptionLabel}
          getKey={(p) => p.id}
          selected={product}
          onSelect={setProduct}
          addNewLabel="Add a new product"
          onAddNew={() => router.push("/products/new")}
        />
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
        <Field label="Quantity received" htmlFor="quantity">
          <Input id="quantity" type="number" inputMode="numeric" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} suffix="units" style={{ width: "100%" }} />
        </Field>
        <Field label="Purchase cost" htmlFor="purchaseCost">
          <Input id="purchaseCost" type="number" inputMode="decimal" min="0" step="0.01" value={purchaseCost} onChange={(e) => setPurchaseCost(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
      </div>

      {quantity && purchaseCost ? <div className="row-s num">Cost per unit: {formatCents(costPerUnitCents)}</div> : null}

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

      <Button type="button" disabled={!canSubmit || saving} onClick={doSave}>
        {saving ? "Saving…" : "Receive stock"}
      </Button>
    </Card>
  );
}
