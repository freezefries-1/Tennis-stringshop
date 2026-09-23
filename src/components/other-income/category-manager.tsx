"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { Icon } from "@/components/ds/icon";
import { renameOtherIncomeCategoryAction } from "@/app/other-income/actions";
import type { OtherIncomeCategoryUsage } from "@/lib/other-income";

function CategoryRow({ usage }: { usage: OtherIncomeCategoryUsage }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(usage.category);
  const [saving, setSaving] = useState(false);

  if (editing) {
    return (
      <div className="row" style={{ gap: 8 }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} size="sm" style={{ flex: 1 }} />
        <Button
          size="sm"
          disabled={saving || !name.trim()}
          onClick={async () => {
            setSaving(true);
            await renameOtherIncomeCategoryAction(usage.category, name);
            setSaving(false);
            setEditing(false);
            // A rename can merge into an already-existing category name
            // (e.g. fixing a duplicate), which changes another row's count
            // too — refresh rather than patch local state so every row
            // stays accurate, not just this one.
            router.refresh();
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => { setName(usage.category); setEditing(false); }}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="row-main">
        <div className="row-t">{name}</div>
        <div className="row-s">
          {usage.count} record{usage.count === 1 ? "" : "s"}
        </div>
      </div>
      <div className="row-end" style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={() => setEditing(true)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer" }}>
          <Icon name="pencil" size={15} />
        </button>
      </div>
    </div>
  );
}

export function OtherIncomeCategoryManager({ categories }: { categories: OtherIncomeCategoryUsage[] }) {
  return (
    <Card padding="8px 20px" style={{ maxWidth: 560 }}>
      <div className="rows">
        {categories.map((c) => (
          <CategoryRow key={c.category} usage={c} />
        ))}
        {categories.length === 0 ? <div className="row-s">No income records yet — categories show up here once you&rsquo;ve recorded some.</div> : null}
      </div>
    </Card>
  );
}
