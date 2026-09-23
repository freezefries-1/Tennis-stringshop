"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ds/input";
import { formatCents } from "@/lib/format";
import { searchPosItems, type PosSearchResult } from "@/app/pos/actions";

/** Fast, mobile-friendly search across both catalogues at once (brief §15/
 * §54) — typing "Tour XT" or "Hyper-G" both work from the same box. Never
 * "selects" an item the way a Combobox does; every result is just an
 * "add to cart" action, since POS is a running cart, not a single pick. */
export function ItemSearch({ onAdd }: { onAdd: (item: PosSearchResult) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PosSearchResult[]>([]);

  useEffect(() => {
    // A cleared search box just hides the (possibly stale) results below —
    // see the `q.trim()` check in the render — so there's nothing to reset
    // here synchronously. `loading` is flipped on in the input's onChange
    // handler, not here — only the async completion below sets state in
    // this effect (same pattern as StringProductPicker).
    const query = q.trim();
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      const r = await searchPosItems(query);
      if (active) {
        setResults(r);
        setLoading(false);
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div style={{ position: "relative" }}>
      <Input
        iconLeft="search"
        placeholder="Search product, string, brand, SKU or barcode…"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          if (e.target.value.trim()) setLoading(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={{ width: "100%", height: 46 }}
      />
      {open && q.trim() ? (
        <div className="results" style={{ maxHeight: 320 }}>
          {loading ? (
            <div className="res-empty">Searching…</div>
          ) : results.length === 0 ? (
            <div className="res-empty">No match for &ldquo;{q.trim()}&rdquo;.</div>
          ) : (
            results.map((r) => {
              const outOfStock = Number(r.available) <= 0;
              return (
                <button
                  key={r.key}
                  type="button"
                  className="res"
                  onMouseDown={() => {
                    onAdd(r);
                    setQ("");
                    setResults([]);
                  }}
                  disabled={outOfStock}
                  style={{ opacity: outOfStock ? 0.5 : 1 }}
                >
                  <span className="res-t">{r.label}</span>
                  <span className="res-s num">
                    {r.sublabel} · {r.available}
                    {r.unit === "m" ? "m" : r.unit === "set" ? " sets" : ""} available
                    {r.priceCents != null ? ` · ${formatCents(r.priceCents)}` : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
