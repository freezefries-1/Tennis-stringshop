"use client";

import { useState } from "react";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Icon } from "@/components/ds/icon";
import { createSupplierAction, deleteSupplierAction, renameSupplierAction, setSupplierActiveAction } from "@/app/suppliers/actions";
import type { Supplier } from "@/lib/string-inventory";

/** Same inline add/rename/archive/delete pattern as the Product Categories
 * manager — suppliers were previously quick-create-only (no way back out of
 * a mistaken or no-longer-used entry). Deleting is only offered once a
 * supplier has no batches or products on it (archiving is the everyday
 * path otherwise, same "archive first, delete blocked while in use" split
 * used throughout this app). */
export function SupplierManager({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {suppliers.map((s) =>
        editingId === s.id ? (
          <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <Field label="Supplier name" style={{ flex: 1 }}>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%" }} />
            </Field>
            <Button
              size="sm"
              disabled={saving || !editName.trim()}
              onClick={async () => {
                setSaving(true);
                await renameSupplierAction(s.id, editName);
                setSuppliers((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: editName.trim() } : x)));
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
        ) : (
          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--ink-100)" }}>
            <span>
              {s.name}
              {!s.active ? (
                <span className="row-s" style={{ marginLeft: 8 }}>
                  Archived
                </span>
              ) : null}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setEditingId(s.id);
                  setEditName(s.name);
                }}
                aria-label={`Edit ${s.name}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name="pencil" size={15} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await setSupplierActiveAction(s.id, !s.active);
                  setSuppliers((prev) => prev.map((x) => (x.id === s.id ? { ...x, active: !x.active } : x)));
                }}
                aria-label={s.active ? `Archive ${s.name}` : `Unarchive ${s.name}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name={s.active ? "archive" : "rotate-ccw"} size={15} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Delete the "${s.name}" supplier? Only possible while nothing on file uses it.`)) return;
                  const result = await deleteSupplierAction(s.id);
                  if (result === "in_use") {
                    alert("This supplier is already on a batch or a product — archive it instead.");
                    return;
                  }
                  setSuppliers((prev) => prev.filter((x) => x.id !== s.id));
                }}
                aria-label={`Delete ${s.name}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ),
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: suppliers.length ? 8 : 0, borderTop: suppliers.length ? "1px solid var(--ink-100)" : "none" }}>
        <div className="lab">Add supplier</div>
        {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <Field label="Name" style={{ flex: 1 }}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Tennis Gear Supplies" style={{ width: "100%" }} />
          </Field>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            iconLeft="plus"
            disabled={saving || !newName.trim()}
            onClick={async () => {
              setSaving(true);
              setError(null);
              try {
                const created = await createSupplierAction(newName);
                setSuppliers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                setNewName("");
              } catch {
                setError("Could not add that supplier.");
              }
              setSaving(false);
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
