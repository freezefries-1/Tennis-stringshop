"use client";

import { useState } from "react";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Icon } from "@/components/ds/icon";
import { createProductCategoryAction, deleteProductCategoryAction, renameProductCategoryAction, setProductCategoryArchivedAction } from "@/app/products/actions";
import type { ProductCategory } from "@/lib/products";

/** Manageable, not hard-coded (brief §3) — the same inline add/rename/
 * archive pattern as the racket catalogue's brand manager and Settings'
 * pattern-defaults manager. Deleting is only offered once a category has no
 * products left on it (archiving is the everyday path otherwise, same
 * "archive first, delete blocked while in use" split used throughout). */
export function CategoryManager({ initialCategories }: { initialCategories: ProductCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {categories.map((c) =>
        editingId === c.id ? (
          <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <Field label="Category name" style={{ flex: 1 }}>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%" }} />
            </Field>
            <Button
              size="sm"
              disabled={saving || !editName.trim()}
              onClick={async () => {
                setSaving(true);
                await renameProductCategoryAction(c.id, editName);
                setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, name: editName.trim() } : x)));
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
          <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid var(--ink-100)" }}>
            <span>
              {c.name}
              {c.archivedAt ? (
                <span className="row-s" style={{ marginLeft: 8 }}>
                  Archived
                </span>
              ) : null}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setEditingId(c.id);
                  setEditName(c.name);
                }}
                aria-label={`Edit ${c.name}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name="pencil" size={15} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await setProductCategoryArchivedAction(c.id, !c.archivedAt);
                  setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, archivedAt: x.archivedAt ? null : new Date() } : x)));
                }}
                aria-label={c.archivedAt ? `Unarchive ${c.name}` : `Archive ${c.name}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name={c.archivedAt ? "rotate-ccw" : "archive"} size={15} />
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Delete the "${c.name}" category? Only possible while no products use it.`)) return;
                  const result = await deleteProductCategoryAction(c.id);
                  if (result === "in_use") {
                    alert("This category still has products on it — archive it instead, or move those products to another category first.");
                    return;
                  }
                  setCategories((prev) => prev.filter((x) => x.id !== c.id));
                }}
                aria-label={`Delete ${c.name}`}
                style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", padding: 6 }}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </div>
        ),
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: categories.length ? 8 : 0, borderTop: categories.length ? "1px solid var(--ink-100)" : "none" }}>
        <div className="lab">Add category</div>
        {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <Field label="Name" style={{ flex: 1 }}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Dampeners" style={{ width: "100%" }} />
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
              const result = await createProductCategoryAction(newName);
              setSaving(false);
              if (result.category) {
                setCategories((prev) => [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
                setNewName("");
              } else {
                setError("Could not add that category.");
              }
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
