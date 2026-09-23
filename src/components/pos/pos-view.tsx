"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { formatCents } from "@/lib/format";
import { createSaleAction, type PosSearchResult } from "@/app/pos/actions";
import { PosCustomerPicker } from "./customer-picker";
import { ItemSearch } from "./item-search";
import { Cart, lineTotalCents } from "./cart";
import type { PickerCustomer, CartLineInput, DiscountType, PaymentMethod, SaleStockShortage } from "@/lib/sales";

export interface CartLine {
  key: string;
  itemType: "product" | "string_product" | "custom";
  productId?: string;
  stringProductId?: string;
  label: string;
  quantity: number;
  unitPriceCents: number;
  standardPriceCentsSnapshot: number;
  discountCents: number;
  manualCogsCents?: number | null;
  unit: "unit" | "m" | "set" | "reel";
  /** Set only for an 'm'-tracked string product with a reel length/price
   * configured — lets the cart offer "sell as: metres / whole reel(s)".
   * meterPriceCentsDefault remembers the per-metre default so toggling
   * back from reel mode can restore it. */
  reelLengthM?: number | null;
  reelSellingPriceCents?: number | null;
  meterPriceCentsDefault?: number | null;
}

function newClientRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "paynow", label: "PayNow" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

export function PosView({ initialCustomer }: { initialCustomer: PickerCustomer | null }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<PickerCustomer | null>(initialCustomer);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customDesc, setCustomDesc] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType | "">("");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paynow");
  const [paymentAmountTouched, setPaymentAmountTouched] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [clientRequestId] = useState(newClientRequestId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shortages, setShortages] = useState<SaleStockShortage[] | null>(null);

  const subtotalCents = useMemo(() => lines.reduce((sum, l) => sum + lineTotalCents(l), 0), [lines]);
  const discountCents = useMemo(() => {
    if (!discountType || !discountValue.trim()) return 0;
    const v = Number.parseFloat(discountValue) || 0;
    const raw = discountType === "percent" ? Math.round(subtotalCents * (v / 100)) : Math.round(v * 100);
    return Math.max(0, Math.min(raw, subtotalCents));
  }, [discountType, discountValue, subtotalCents]);
  const totalCents = subtotalCents - discountCents;
  const effectivePaymentAmountCents = paymentAmountTouched ? Math.round((Number.parseFloat(paymentAmount) || 0) * 100) : totalCents;

  function addItem(item: PosSearchResult) {
    const key = `${item.kind}:${item.id}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      const unit: CartLine["unit"] = item.unit === "m" ? "m" : item.unit === "set" ? "set" : "unit";
      return [
        ...prev,
        {
          key,
          itemType: item.kind,
          productId: item.kind === "product" ? item.id : undefined,
          stringProductId: item.kind === "string_product" ? item.id : undefined,
          label: item.label,
          quantity: 1,
          unitPriceCents: item.priceCents ?? 0,
          standardPriceCentsSnapshot: item.priceCents ?? 0,
          discountCents: 0,
          unit,
          reelLengthM: item.reelLengthM ?? null,
          reelSellingPriceCents: item.reelSellingPriceCents ?? null,
          meterPriceCentsDefault: item.priceCents ?? null,
        },
      ];
    });
    setShortages(null);
  }

  function addCustomItem() {
    if (!customDesc.trim()) return;
    const priceCents = Math.round((Number.parseFloat(customPrice) || 0) * 100);
    setLines((prev) => [
      ...prev,
      {
        key: `custom:${Date.now()}`,
        itemType: "custom",
        label: customDesc.trim(),
        quantity: 1,
        unitPriceCents: priceCents,
        standardPriceCentsSnapshot: priceCents,
        discountCents: 0,
        unit: "unit",
      },
    ]);
    setCustomDesc("");
    setCustomPrice("");
  }

  async function completeSale(allowStockOverride = false) {
    setSaving(true);
    setError(null);
    const items: CartLineInput[] = lines.map((l) => ({
      itemType: l.itemType,
      productId: l.productId ?? null,
      stringProductId: l.stringProductId ?? null,
      descriptionOverride: l.label,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      discountCents: l.discountCents,
      manualCogsCents: l.manualCogsCents ?? null,
      inventoryQuantityOverride: l.unit === "reel" ? l.quantity * (l.reelLengthM ?? 1) : null,
    }));
    const result = await createSaleAction({
      customerId: customer?.id ?? null,
      items,
      discountType: discountType || null,
      discountValue: discountType ? Number.parseFloat(discountValue) || 0 : null,
      initialPaymentCents: effectivePaymentAmountCents > 0 ? effectivePaymentAmountCents : null,
      initialPaymentMethod: effectivePaymentAmountCents > 0 ? paymentMethod : null,
      notes: notes || null,
      allowStockOverride,
      clientRequestId,
    });
    setSaving(false);
    if (!result.ok) {
      if (result.reason === "insufficient_stock") {
        setShortages(result.shortages);
        return;
      }
      setError("Add at least one item to the cart.");
      return;
    }
    router.push(`/sales/${result.sale.id}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}>
      <PosCustomerPicker selected={customer} onSelect={setCustomer} />

      <Card padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="lab">Add items</div>
        <ItemSearch onAdd={addItem} />
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Custom item" style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="e.g. Replacement butt cap" style={{ width: "100%", minWidth: 0 }} />
          </Field>
          <Field label="Price" style={{ width: 100, minWidth: 0 }}>
            <Input type="number" inputMode="decimal" min="0" step="0.01" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} style={{ width: "100%", minWidth: 0 }} />
          </Field>
          <Button type="button" size="sm" variant="secondary" onClick={addCustomItem} disabled={!customDesc.trim()}>
            Add
          </Button>
        </div>
      </Card>

      <Card padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="lab">Cart</div>
        <Cart lines={lines} onChange={setLines} />
        {shortages && shortages.length > 0 ? (
          <div className="form-warning">
            <p>Not enough stock for this sale:</p>
            <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
              {shortages.map((s, i) => (
                <li key={i} style={{ fontSize: 13.5 }}>
                  {s.label}: needed {s.neededQty}
                  {s.unit === "m" ? "m" : s.unit === "set" ? " sets" : ""}, only {s.availableQty} available
                </li>
              ))}
            </ul>
            <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => completeSale(true)}>
              Complete anyway (uses more stock than recorded)
            </Button>
          </div>
        ) : null}
      </Card>

      <Card padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="lab">Discount</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Type" style={{ width: 140, minWidth: 0 }}>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType | "")}
              style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
            >
              <option value="">No discount</option>
              <option value="fixed">Fixed amount</option>
              <option value="percent">Percent</option>
            </select>
          </Field>
          {discountType ? (
            <Field label={discountType === "percent" ? "Percent" : "Amount"} style={{ width: 100, minWidth: 0 }}>
              <Input type="number" inputMode="decimal" min="0" step={discountType === "percent" ? "1" : "0.01"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} suffix={discountType === "percent" ? "%" : "SGD"} style={{ width: "100%", minWidth: 0 }} />
            </Field>
          ) : null}
        </div>
      </Card>

      <Card padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="lab">Payment</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="Method" style={{ width: 160, minWidth: 0 }}>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Amount received" style={{ width: 140, minWidth: 0 }}>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={paymentAmountTouched ? paymentAmount : (totalCents / 100).toFixed(2)}
              onChange={(e) => {
                setPaymentAmountTouched(true);
                setPaymentAmount(e.target.value);
              }}
              suffix="SGD"
              style={{ width: "100%", minWidth: 0 }}
            />
          </Field>
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-s)", color: "var(--text-muted)" }}>Amount received defaults to the total — set to 0 to leave unpaid.</div>
        <Field label="Notes" htmlFor="notes" hint="Optional">
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%" }} />
        </Field>
      </Card>

      {error ? (
        <div className="form-warning">
          <p>{error}</p>
        </div>
      ) : null}

      <Card padding="16px 20px" style={{ display: "flex", flexDirection: "column", gap: 10, boxShadow: "var(--shadow-2)", border: "1px solid var(--court-200)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span>Subtotal</span>
          <span className="num">{formatCents(subtotalCents)}</span>
        </div>
        {discountCents > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span>Discount</span>
            <span className="num">−{formatCents(discountCents)}</span>
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19, paddingTop: 8, borderTop: "1px solid var(--ink-100)" }}>
          <span>Total</span>
          <span className="num">{formatCents(totalCents)}</span>
        </div>
        <Button type="button" size="lg" disabled={saving || lines.length === 0} onClick={() => completeSale(false)}>
          {saving ? "Completing sale…" : "Complete sale"}
        </Button>
      </Card>
    </div>
  );
}
