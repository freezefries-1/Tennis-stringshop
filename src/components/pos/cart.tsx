"use client";

import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Icon } from "@/components/ds/icon";
import { formatCents } from "@/lib/format";
import type { CartLine } from "./pos-view";

function lineTotalCents(line: CartLine): number {
  return Math.max(0, Math.round(line.unitPriceCents * line.quantity) - line.discountCents);
}

/** Every line shows Product/Variant, Quantity, Unit Price, Discount and
 * Line Total (brief §16), with quantity/price/discount all editable
 * in-line — no navigating to a separate screen to adjust a cart line. */
export function Cart({ lines, onChange }: { lines: CartLine[]; onChange: (lines: CartLine[]) => void }) {
  const update = (key: string, patch: Partial<CartLine>) => onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const remove = (key: string) => onChange(lines.filter((l) => l.key !== key));
  const step = (l: CartLine) => (l.unit === "m" ? 0.1 : 1);

  if (lines.length === 0) {
    return <div className="rec-empty">Cart is empty — search above to add items.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {lines.map((l) => (
        <div key={l.key} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14.5 }}>{l.label}</div>
              {l.itemType === "custom" ? <span className="row-s">Custom item</span> : null}
            </div>
            <button type="button" onClick={() => remove(l.key)} aria-label={`Remove ${l.label}`} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer" }}>
              <Icon name="trash" size={16} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <Field label="Qty" style={{ width: 84, minWidth: 0 }}>
              <Input type="number" inputMode="decimal" min="0" step={step(l)} value={String(l.quantity)} onChange={(e) => update(l.key, { quantity: Number(e.target.value) || 0 })} style={{ width: "100%", minWidth: 0 }} />
            </Field>
            <Field label="Unit price" style={{ width: 100, minWidth: 0 }} hint={l.unitPriceCents !== l.standardPriceCentsSnapshot ? `Standard ${formatCents(l.standardPriceCentsSnapshot)}` : undefined}>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={(l.unitPriceCents / 100).toFixed(2)}
                onChange={(e) => update(l.key, { unitPriceCents: Math.round((Number.parseFloat(e.target.value) || 0) * 100) })}
                style={{ width: "100%", minWidth: 0 }}
              />
            </Field>
            <Field label="Discount" style={{ width: 90, minWidth: 0 }}>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={(l.discountCents / 100).toFixed(2)}
                onChange={(e) => update(l.key, { discountCents: Math.round((Number.parseFloat(e.target.value) || 0) * 100) })}
                style={{ width: "100%", minWidth: 0 }}
              />
            </Field>
            <div className="num" style={{ minWidth: 72, textAlign: "right", paddingBottom: 9, fontSize: 15, fontWeight: 500 }}>
              {formatCents(lineTotalCents(l))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export { lineTotalCents };
