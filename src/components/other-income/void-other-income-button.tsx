"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { voidOtherIncomeAction } from "@/app/other-income/actions";

/** Never a delete — the row and its income number stay forever, excluded
 * from every financial total from this point on, kept for audit — same
 * pattern as VoidExpenseButton. */
export function VoidOtherIncomeButton({ incomeId }: { incomeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="ghost" style={{ color: "var(--signal-danger)" }} onClick={() => setOpen(true)}>
        Void income record
      </Button>
    );
  }

  return (
    <div className="form-danger" style={{ maxWidth: 360, display: "flex", flexDirection: "column", gap: 8 }}>
      <p>
        <strong>Void this income record?</strong> It&rsquo;s kept for audit, marked voided, and excluded from Net Profit from now on. It is never deleted.
      </p>
      {error ? <p style={{ color: "var(--signal-danger)", fontSize: 13 }}>{error}</p> : null}
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for voiding"
        style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 14 }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          variant="danger"
          disabled={saving || !reason.trim()}
          onClick={async () => {
            setSaving(true);
            setError(null);
            const result = await voidOtherIncomeAction(incomeId, reason);
            setSaving(false);
            if (!result.ok) {
              setError("This income record is already voided.");
              return;
            }
            router.refresh();
          }}
        >
          {saving ? "Voiding…" : "Confirm void"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </div>
  );
}
