"use client";

import { useState } from "react";
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

  // Switching "sell as" resets quantity to 1 (of whichever unit is now
  // selected) and swaps in that unit's own default price — reel price for
  // reel mode, the remembered per-metre default for metre mode — since a
  // quantity/price that made sense in one unit rarely does in the other.
  const setSellUnit = (l: CartLine, mode: "m" | "reel") => {
    if (mode === l.unit) return;
    const price = mode === "reel" ? (l.reelSellingPriceCents ?? Math.round((l.meterPriceCentsDefault ?? l.unitPriceCents) * (l.reelLengthM ?? 1))) : (l.meterPriceCentsDefault ?? 0);
    update(l.key, { unit: mode, quantity: 1, unitPriceCents: price, standardPriceCentsSnapshot: price });
  };

  // Unit price/discount are stored as cents and displayed via .toFixed(2),
  // which reformats on every keystroke and fights whatever's mid-typed (e.g.
  // typing "12.50" snaps to "12.00" after the first digit, then every further
  // keystroke lands after that fixed text and rounds straight back to it).
  // Keep the raw text the user is typing here and only fall back to the
  // formatted value once there's no in-progress edit for that field.
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [discountDrafts, setDiscountDrafts] = useState<Record<string, string>>({});
  const clearDraft = (setter: typeof setPriceDrafts, key: string) => setter((d) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== key)));

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
          {l.reelLengthM != null ? (
            <div className="tabs-lite" role="tablist" style={{ alignSelf: "flex-start" }}>
              <button type="button" className={"tab-lite" + (l.unit !== "reel" ? " on" : "")} onClick={() => setSellUnit(l, "m")}>
                Sell by the metre
              </button>
              <button type="button" className={"tab-lite" + (l.unit === "reel" ? " on" : "")} onClick={() => setSellUnit(l, "reel")}>
                Sell whole reel ({l.reelLengthM}m)
              </button>
            </div>
          ) : null}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <Field label={l.unit === "reel" ? "Reels" : "Qty"} style={{ width: 84, minWidth: 0 }}>
              <Input type="number" inputMode="decimal" min="0" step={step(l)} value={String(l.quantity)} onChange={(e) => update(l.key, { quantity: Number(e.target.value) || 0 })} style={{ width: "100%", minWidth: 0 }} />
            </Field>
            <Field label="Unit price" style={{ width: 100, minWidth: 0 }} hint={l.unitPriceCents !== l.standardPriceCentsSnapshot ? `Standard ${formatCents(l.standardPriceCentsSnapshot)}` : undefined}>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={priceDrafts[l.key] ?? (l.unitPriceCents / 100).toFixed(2)}
                onChange={(e) => {
                  const raw = e.target.value;
                  setPriceDrafts((d) => ({ ...d, [l.key]: raw }));
                  update(l.key, { unitPriceCents: Math.round((Number.parseFloat(raw) || 0) * 100) });
                }}
                onBlur={() => clearDraft(setPriceDrafts, l.key)}
                style={{ width: "100%", minWidth: 0 }}
              />
            </Field>
            <Field label="Discount" style={{ width: 90, minWidth: 0 }}>
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={discountDrafts[l.key] ?? (l.discountCents / 100).toFixed(2)}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDiscountDrafts((d) => ({ ...d, [l.key]: raw }));
                  update(l.key, { discountCents: Math.round((Number.parseFloat(raw) || 0) * 100) });
                }}
                onBlur={() => clearDraft(setDiscountDrafts, l.key)}
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
