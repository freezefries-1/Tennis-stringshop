"use client";

import { useState } from "react";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** One search-to-filter dropdown (used for Brand/Series/Model pickers in
 * both the customer racket form and the catalogue's model form), with an
 * inline "+ Add new …" row when nothing matches the typed query. */
export function Combobox<T>({
  label,
  placeholder,
  options,
  getLabel,
  getKey,
  selected,
  onSelect,
  disabled,
  loading,
  addNewLabel,
  onAddNew,
}: {
  label: string;
  placeholder: string;
  options: T[];
  getLabel: (t: T) => string;
  getKey: (t: T) => string;
  selected: T | null;
  onSelect: (t: T | null) => void;
  disabled?: boolean;
  loading?: boolean;
  addNewLabel: string;
  onAddNew: (query: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = q.trim() ? options.filter((o) => norm(getLabel(o)).includes(norm(q))) : options;

  if (selected) {
    return (
      <Field label={label}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-100)" }}>
          <span style={{ flex: 1, fontSize: 15 }}>{getLabel(selected)}</span>
          {!disabled ? (
            <button type="button" onClick={() => onSelect(null)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", fontSize: 13 }}>
              Change
            </button>
          ) : null}
        </div>
      </Field>
    );
  }

  return (
    <Field label={label}>
      <div style={{ position: "relative" }}>
        <Input
          placeholder={disabled ? "—" : loading ? "Loading…" : placeholder}
          value={q}
          disabled={disabled || loading}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{ width: "100%" }}
        />
        {open && !disabled && !loading ? (
          <div className="results" style={{ maxHeight: 240 }}>
            {filtered.length === 0 && !q.trim() ? (
              <div className="res-empty">Type to search, or add a new one.</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={getKey(o)}
                  type="button"
                  className="res"
                  onMouseDown={() => {
                    onSelect(o);
                    setQ("");
                  }}
                >
                  <span className="res-t">{getLabel(o)}</span>
                </button>
              ))
            )}
            {q.trim() ? (
              <button
                type="button"
                className="res"
                onMouseDown={() => {
                  onAddNew(q.trim());
                  setQ("");
                }}
              >
                <span className="res-t" style={{ color: "var(--court-600)" }}>
                  + {addNewLabel} “{q.trim()}”
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Field>
  );
}
