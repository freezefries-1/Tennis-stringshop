"use client";

import { useEffect, useState } from "react";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { fetchStringProductsForPicker, quickCreateStringProductForJob } from "@/app/jobs/actions";

export interface PickedStringProduct {
  id: string;
  brand: string;
  name: string;
  gauge: string | null;
  colour: string | null;
  trackingUnit: "m" | "set";
}

function QuickAddStringProduct({ initialQuery, onCancel, onCreated }: { initialQuery: string; onCancel: () => void; onCreated: (p: PickedStringProduct) => void }) {
  const [brand, setBrand] = useState("");
  const [name, setName] = useState(initialQuery);
  const [gauge, setGauge] = useState("");
  const [colour, setColour] = useState("");
  const [material, setMaterial] = useState("");
  const [trackingUnit, setTrackingUnit] = useState<"m" | "set">("m");
  const [saving, setSaving] = useState(false);

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
      <div className="lab">Add string to inventory</div>
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
          <button type="button" className={"tab-lite" + (trackingUnit === "m" ? " on" : "")} onClick={() => setTrackingUnit("m")}>
            Reels (metres)
          </button>
          <button type="button" className={"tab-lite" + (trackingUnit === "set" ? " on" : "")} onClick={() => setTrackingUnit("set")}>
            Sets
          </button>
        </div>
      </Field>
      <div className="row-s">Stock starts at zero — receive it from the Inventory page once it&rsquo;s in the catalogue.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          size="sm"
          disabled={saving || !brand.trim() || !name.trim()}
          onClick={async () => {
            setSaving(true);
            const created = await quickCreateStringProductForJob({ brand, name, gauge: gauge || null, colour: colour || null, material: material || null, trackingUnit });
            setSaving(false);
            onCreated({ id: created.id, brand: created.brand, name: created.name, gauge: created.gauge, colour: created.colour, trackingUnit: created.trackingUnit });
          }}
        >
          {saving ? "Saving…" : "Save string"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

/** Search-to-select for SportCraft Stock strings (brief §18) — shows live
 * stock per option, never cost. The "selected" chip renders straight off
 * `selectedLabel` (built by the caller from brand/stringName snapshot text
 * already on the form) rather than re-fetching the product, so repeating a
 * previous setup or opening an edit never needs an extra round trip. */
export function StringProductPicker({
  selectedId,
  selectedLabel,
  selectedUnit,
  onSelect,
}: {
  selectedId: string;
  selectedLabel: string;
  /** Reel (metres) vs set — shown as a tag next to the selection so two
   * products with the same name (e.g. the same string tracked once by the
   * reel and again by the set) stay visually distinguishable after picking
   * one, not just while searching. */
  selectedUnit?: "m" | "set";
  onSelect: (product: PickedStringProduct | null) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Awaited<ReturnType<typeof fetchStringProductsForPicker>>>([]);
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  useEffect(() => {
    const query = q.trim();
    // A cleared search box just hides the (possibly stale) results below —
    // see the `!q.trim()` branch in the render, so there's nothing to
    // reset here synchronously. `loading` itself is flipped on in the
    // input's onChange (the triggering event handler), not here — only the
    // async .then()-style completion below may set state in this effect.
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      const r = await fetchStringProductsForPicker(query);
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

  if (selectedId) {
    return (
      <Field label="String">
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-100)" }}>
          <span style={{ flex: 1, fontSize: 15 }}>{selectedLabel || "Selected string"}</span>
          {selectedUnit ? <Badge tone="neutral">{selectedUnit === "set" ? "Set" : "Reel"}</Badge> : null}
          <button type="button" onClick={() => onSelect(null)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", fontSize: 13 }}>
            Change
          </button>
        </div>
      </Field>
    );
  }

  return (
    <Field label="String">
      <div style={{ position: "relative" }}>
        <Input
          placeholder="Search Hyper-G, Solinco, 1.25…"
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            if (e.target.value.trim()) setLoading(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ width: "100%" }}
        />
        {open ? (
          <div className="results" style={{ maxHeight: 260 }}>
            {!q.trim() ? (
              <div className="res-empty">Type to search SportCraft stock.</div>
            ) : loading ? (
              <div className="res-empty">Searching…</div>
            ) : results.length === 0 ? (
              <div className="res-empty">No match for &ldquo;{q.trim()}&rdquo;.</div>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="res"
                  onMouseDown={() => {
                    onSelect({ id: r.id, brand: r.brand, name: r.name, gauge: r.gauge, colour: r.colour, trackingUnit: r.trackingUnit });
                    setQ("");
                  }}
                >
                  <span className="res-t">{r.label}</span>
                  <span className="res-s num">
                    {r.available}
                    {r.trackingUnit === "set" ? " sets" : "m"} available
                  </span>
                </button>
              ))
            )}
            {q.trim() ? (
              <button type="button" className="res" onMouseDown={() => setQuickAdd(q.trim())}>
                <span className="res-t" style={{ color: "var(--court-600)" }}>
                  + Add string product &ldquo;{q.trim()}&rdquo;
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {quickAdd !== null ? (
        <QuickAddStringProduct
          initialQuery={quickAdd}
          onCancel={() => setQuickAdd(null)}
          onCreated={(p) => {
            onSelect(p);
            setQuickAdd(null);
          }}
        />
      ) : null}
    </Field>
  );
}
