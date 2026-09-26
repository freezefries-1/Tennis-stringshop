"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { updateSaleDateAction } from "@/app/sales/actions";
import { toSGDateInputValue } from "@/lib/format";

export function EditSaleDateButton({ saleId, occurredAt }: { saleId: string; occurredAt: string | Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // The Singapore calendar date, matching what formatDate renders on the
  // page — not toISOString().slice(0, 10), which gives the UTC date and
  // can silently disagree by a day (see updateSaleDate's comment).
  const [date, setDate] = useState(() => toSGDateInputValue(occurredAt));
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit date
      </Button>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 14 }}
      />
      <Button
        size="sm"
        disabled={saving || !date}
        onClick={async () => {
          setSaving(true);
          await updateSaleDateAction(saleId, date);
          setSaving(false);
          setOpen(false);
          router.refresh();
        }}
      >
        {saving ? "Saving…" : "Save"}
      </Button>
      <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  );
}
