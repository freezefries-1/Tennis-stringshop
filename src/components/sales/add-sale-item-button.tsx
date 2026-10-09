"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { formatCents } from "@/lib/format";
import { addItemToSaleAction, fetchProductsForSalePicker } from "@/app/sales/actions";
import type { PosSearchResult } from "@/app/pos/actions";

/** Adds a forgotten product to an already-completed sale — same search/add
 * flow as the job detail page's "Add product to sale" (linked-sale-panel.tsx),
 * generalized to any sale (addItemToSale has nothing job-specific in it).
 * Hidden once the sale has a payment — ring up a new item as its own sale
 * instead, same reasoning as addItemToSale's own guard. */
export function AddSaleItemButton({ saleId, paymentStatus }: { saleId: string; paymentStatus: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PosSearchResult[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      const r = await fetchProductsForSalePicker(query);
      if (active) setResults(r.map((p) => ({ key: p.id, kind: "product" as const, id: p.id, label: p.label, sublabel: p.categoryName, priceCents: p.defaultSellingPriceCents, available: p.trackInventory ? p.available : "∞", unit: "unit" })));
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  if (paymentStatus !== "unpaid") return null;

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Add item
      </Button>
    );
  }

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <Input
        placeholder="Search product…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: "100%" }}
      />
      {q.trim() ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div className="row-s">No match.</div>
          ) : (
            results.map((r) => (
              <button
                key={r.key}
                type="button"
                className="res"
                disabled={adding === r.id}
                onClick={async () => {
                  setAdding(r.id);
                  setError(null);
                  const result = await addItemToSaleAction(saleId, r.id, 1);
                  setAdding(null);
                  if (!result.ok) {
                    setError(result.reason === "sale_locked" ? "This sale already has a payment — can't add more items to it." : "Not enough stock for this product.");
                    return;
                  }
                  setQ("");
                  setResults([]);
                  router.refresh();
                }}
              >
                <span className="res-t">{r.label}</span>
                <span className="res-s num">
                  {r.sublabel} · {r.priceCents != null ? formatCents(r.priceCents) : "—"}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Close
      </Button>
    </Card>
  );
}
