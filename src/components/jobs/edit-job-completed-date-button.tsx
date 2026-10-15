"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { updateJobCompletedDateAction } from "@/app/jobs/actions";
import { toSGDateInputValue } from "@/lib/format";

/** Mirrors EditSaleDateButton (src/components/sales/edit-sale-date-button.tsx)
 * — same control, for backfilling a historical job's completed date instead
 * of a sale's. Updates the linked Sale's own date too (see
 * updateJobCompletedDate's comment in jobs.ts), so correcting either side
 * keeps both in sync. */
export function EditJobCompletedDateButton({ jobId, completedAt }: { jobId: string; completedAt: string | Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => toSGDateInputValue(completedAt));
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
          await updateJobCompletedDateAction(jobId, date);
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
