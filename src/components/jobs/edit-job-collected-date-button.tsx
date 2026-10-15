"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { updateJobCollectedDateAction } from "@/app/jobs/actions";
import { toSGDateInputValue } from "@/lib/format";

/** Mirrors EditJobCompletedDateButton — same control, for the Collected
 * date instead. No linked-record sync needed here: nothing reads
 * collectedAt for revenue/period reporting (see updateJobCollectedDate's
 * comment in jobs.ts), unlike completedAt via the linked Sale. */
export function EditJobCollectedDateButton({ jobId, collectedAt }: { jobId: string; collectedAt: string | Date }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => toSGDateInputValue(collectedAt));
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
          await updateJobCollectedDateAction(jobId, date);
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
