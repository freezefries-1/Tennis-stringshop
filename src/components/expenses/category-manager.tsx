"use client";

import { useState } from "react";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Icon } from "@/components/ds/icon";
import { Badge } from "@/components/ds/badge";
import { createExpenseCategoryAction, renameExpenseCategoryAction, setExpenseCategoryArchivedAction, deleteExpenseCategoryAction } from "@/app/expenses/actions";
import type { ExpenseCategory } from "@/lib/expenses";

function CategoryRow({ category }: { category: ExpenseCategory }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [archived, setArchived] = useState(!!category.archivedAt);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (deleted) return null;

  if (editing) {
    return (
      <div className="row" style={{ gap: 8 }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} size="sm" style={{ flex: 1 }} />
        <Button
          size="sm"
          disabled={!name.trim()}
          onClick={async () => {
            await renameExpenseCategoryAction(category.id, name);
            setEditing(false);
          }}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="row-main">
        <div className="row-t">{name}</div>
        {error ? <div className="row-s" style={{ color: "var(--signal-danger)" }}>{error}</div> : null}
      </div>
      <div className="row-end" style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        {archived ? <Badge tone="neutral">Archived</Badge> : null}
        <button type="button" onClick={() => setEditing(true)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer" }}>
          <Icon name="pencil" size={15} />
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={async () => {
            if (!archived && !confirm(`Archive category "${name}"? It stays visible on existing expenses but won't be offered for new ones.`)) return;
            await setExpenseCategoryArchivedAction(category.id, !archived);
            setArchived((a) => !a);
          }}
        >
          {archived ? "Unarchive" : "Archive"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          style={{ color: "var(--signal-danger)" }}
          onClick={async () => {
            if (!confirm(`Delete category "${name}"? Only possible if no expense uses it.`)) return;
            const result = await deleteExpenseCategoryAction(category.id);
            if (!result.ok) {
              setError("In use by existing expenses — archive instead of deleting.");
              return;
            }
            setDeleted(true);
          }}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

export function CategoryManager({ categories: initial }: { categories: ExpenseCategory[] }) {
  const [categories, setCategories] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 560 }}>
      <Card padding="8px 20px">
        <div className="rows">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
          {categories.length === 0 ? <div className="row-s">No categories yet.</div> : null}
        </div>
      </Card>

      {adding ? (
        <Card tone="sunken" padding="16px 20px" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <Field label="New category name" style={{ flex: 1 }}>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <Button
            size="sm"
            disabled={!newName.trim()}
            onClick={async () => {
              const created = await createExpenseCategoryAction(newName);
              setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
              setNewName("");
              setAdding(false);
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </Card>
      ) : (
        <Button variant="secondary" iconLeft="plus" onClick={() => setAdding(true)} style={{ alignSelf: "flex-start" }}>
          Add category
        </Button>
      )}
    </div>
  );
}
