"use client";

import { useEffect, useState } from "react";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { fetchCustomersForPos, quickCreateCustomerForPos } from "@/app/pos/actions";
import type { PickerCustomer } from "@/lib/sales";

function QuickAddCustomer({ initialName, onCreated, onCancel }: { initialName: string; onCreated: (c: PickerCustomer) => void; onCancel: () => void }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <Card tone="sunken" padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="lab">Add customer</div>
      <div className="form-grid">
        <Field label="Name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="Phone" required>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" style={{ width: "100%" }} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          size="sm"
          disabled={saving || !name.trim() || !phone.trim()}
          onClick={async () => {
            setSaving(true);
            const created = await quickCreateCustomerForPos(name, phone);
            setSaving(false);
            onCreated(created);
          }}
        >
          {saving ? "Saving…" : "Save customer"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

/** Customer is optional (brief §14 — "Walk-In or no linked customer"); the
 * default un-selected state IS "walk-in", not a required step. */
export function PosCustomerPicker({ selected, onSelect }: { selected: PickerCustomer | null; onSelect: (c: PickerCustomer | null) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<PickerCustomer[]>([]);
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  useEffect(() => {
    // A cleared search box just hides the (possibly stale) results below —
    // see the `q.trim()` check in the render — so there's nothing to reset
    // here synchronously.
    const query = q.trim();
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      const r = await fetchCustomersForPos(query);
      if (active) setResults(r);
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  if (selected) {
    return (
      <Field label="Customer">
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-100)" }}>
          <span style={{ flex: 1, fontSize: 15 }}>
            {selected.name} · {selected.code}
          </span>
          <button type="button" onClick={() => onSelect(null)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", fontSize: 13 }}>
            Change
          </button>
        </div>
      </Field>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Field label="Customer" hint="Optional — leave blank for a walk-in sale">
        <div style={{ position: "relative" }}>
          <Input
            placeholder="Search name, phone or customer ID…"
            value={q}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            style={{ width: "100%" }}
          />
          {open && q.trim() ? (
            <div className="results" style={{ maxHeight: 240 }}>
              {results.length === 0 ? (
                <div className="res-empty">No match for &ldquo;{q.trim()}&rdquo;.</div>
              ) : (
                results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="res"
                    onMouseDown={() => {
                      onSelect(c);
                      setQ("");
                    }}
                  >
                    <span className="res-t">{c.name}</span>
                    <span className="res-s num">
                      {c.code} · {c.phone}
                    </span>
                  </button>
                ))
              )}
              <button type="button" className="res" onMouseDown={() => setQuickAdd(q.trim())}>
                <span className="res-t" style={{ color: "var(--court-600)" }}>
                  + Add customer &ldquo;{q.trim()}&rdquo;
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </Field>
      {quickAdd !== null ? (
        <QuickAddCustomer
          initialName={quickAdd}
          onCancel={() => setQuickAdd(null)}
          onCreated={(c) => {
            onSelect(c);
            setQuickAdd(null);
          }}
        />
      ) : null}
    </div>
  );
}
