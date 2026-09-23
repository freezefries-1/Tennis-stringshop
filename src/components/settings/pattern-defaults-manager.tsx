"use client";

import { useState } from "react";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Icon } from "@/components/ds/icon";
import { createPatternDefaultAction, deletePatternDefaultAction, updatePatternDefaultAction } from "@/app/settings/actions";
import type { StringPatternDefault } from "@/lib/string-usage";

interface RowDraft {
  pattern: string;
  fullBedLengthM: string;
  mainLengthM: string;
  crossLengthM: string;
}

function toDraft(row?: StringPatternDefault): RowDraft {
  return {
    pattern: row?.pattern ?? "",
    fullBedLengthM: row?.fullBedLengthM ?? "",
    mainLengthM: row?.mainLengthM ?? "",
    crossLengthM: row?.crossLengthM ?? "",
  };
}

function DraftRow({ draft, onChange, patternDisabled }: { draft: RowDraft; onChange: (patch: Partial<RowDraft>) => void; patternDisabled?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Field label="Pattern" hint={patternDisabled ? undefined : "e.g. 16x19"}>
        <Input value={draft.pattern} onChange={(e) => onChange({ pattern: e.target.value })} placeholder="16x19" disabled={patternDisabled} style={{ width: "100%" }} />
      </Field>
      {/* minmax(0, 1fr) rather than a bare 1fr — Input's own wrapper has a
       * fixed minWidth of 160px (src/components/ds/input.tsx), which a
       * plain 1fr track would still respect, overflowing the card on
       * narrow screens; minmax(0, ...) lets the track shrink below that,
       * and the matching minWidth: 0 below removes the 160px floor itself.
       * The three length fields sit on their own row, below Pattern, for
       * the same reason — keep the whole control inside its card at any
       * width. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <Field label="Full bed">
          <Input type="number" inputMode="decimal" min="0" step="0.1" value={draft.fullBedLengthM} onChange={(e) => onChange({ fullBedLengthM: e.target.value })} suffix="m" style={{ width: "100%", minWidth: 0 }} />
        </Field>
        <Field label="Mains">
          <Input type="number" inputMode="decimal" min="0" step="0.1" value={draft.mainLengthM} onChange={(e) => onChange({ mainLengthM: e.target.value })} suffix="m" style={{ width: "100%", minWidth: 0 }} />
        </Field>
        <Field label="Crosses">
          <Input type="number" inputMode="decimal" min="0" step="0.1" value={draft.crossLengthM} onChange={(e) => onChange({ crossLengthM: e.target.value })} suffix="m" style={{ width: "100%", minWidth: 0 }} />
        </Field>
      </div>
    </div>
  );
}

/** Configurable per-pattern string usage defaults (brief: "16x19", "18x20",
 * ...) — the middle tier between a racket model's own recommended length
 * and the flat global default (see src/lib/string-usage.ts). Each of the
 * three lengths is independently optional: a pattern can set just Full bed
 * and leave Mains/Crosses to fall back further. */
export function PatternDefaultsManager({ initialRows }: { initialRows: StringPatternDefault[] }) {
  const [rows, setRows] = useState(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<RowDraft>(toDraft());
  const [newDraft, setNewDraft] = useState<RowDraft>(toDraft());
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const startEdit = (row: StringPatternDefault) => {
    setEditingId(row.id);
    setEditDraft(toDraft(row));
    setEditError(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {rows.length === 0 ? <div className="row-s">No pattern defaults yet — new jobs fall back to the global default below.</div> : null}
      {rows.map((row) =>
        editingId === row.id ? (
          <div key={row.id} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "10px 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
            {editError ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{editError}</span> : null}
            <DraftRow draft={editDraft} onChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))} patternDisabled />
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  await updatePatternDefaultAction(row.id, editDraft);
                  setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, fullBedLengthM: editDraft.fullBedLengthM || null, mainLengthM: editDraft.mainLengthM || null, crossLengthM: editDraft.crossLengthM || null } : r)));
                  setSaving(false);
                  setEditingId(null);
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" disabled={saving} onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div key={row.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--ink-100)" }}>
            <div>
              <span className="num" style={{ fontWeight: 500 }}>{row.pattern}</span>
              <span className="row-s" style={{ marginLeft: 10 }}>
                Full bed {row.fullBedLengthM ?? "—"}m · Main {row.mainLengthM ?? "—"}m · Cross {row.crossLengthM ?? "—"}m
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button type="button" onClick={() => startEdit(row)} aria-label={`Edit ${row.pattern}`} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}>
                <Icon name="pencil" size={15} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Remove the ${row.pattern} default? Jobs for that pattern will fall back to the global default.`)) return;
                  await deletePatternDefaultAction(row.id);
                  setRows((prev) => prev.filter((r) => r.id !== row.id));
                }}
                aria-label={`Remove ${row.pattern}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ),
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: rows.length ? 8 : 0, borderTop: rows.length ? "1px solid var(--ink-100)" : "none" }}>
        <div className="lab">Add pattern default</div>
        {addError ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{addError}</span> : null}
        <DraftRow draft={newDraft} onChange={(patch) => setNewDraft((d) => ({ ...d, ...patch }))} />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          iconLeft="plus"
          disabled={saving || !newDraft.pattern.trim()}
          style={{ alignSelf: "flex-start" }}
          onClick={async () => {
            setSaving(true);
            setAddError(null);
            const result = await createPatternDefaultAction(newDraft);
            setSaving(false);
            if (result.status === "duplicate") {
              setAddError(`A default for ${newDraft.pattern.trim()} already exists — edit it below instead.`);
              return;
            }
            setRows((prev) => [...prev, result.row!].sort((a, b) => a.pattern.localeCompare(b.pattern)));
            setNewDraft(toDraft());
          }}
        >
          Add pattern default
        </Button>
      </div>
    </div>
  );
}
