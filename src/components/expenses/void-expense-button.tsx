"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { voidExpenseAction } from "@/app/expenses/actions";

/** Never a delete — the row and its expense number stay forever, excluded
 * from every financial total from this point on, kept for audit (brief
 * §8/§33). */
export function VoidExpenseButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="ghost" style={{ color: "var(--signal-danger)" }} onClick={() => setOpen(true)}>
        Void expense
      </Button>
    );
  }

  return (
    <div className="form-danger" style={{ maxWidth: 360, display: "flex", flexDirection: "column", gap: 8 }}>
      <p>
        <strong>Void this expense?</strong> The record is kept for audit, marked voided, and excluded from Operating Expenses / Net Profit from now on. It is never deleted.
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
            const result = await voidExpenseAction(expenseId, reason);
            setSaving(false);
            if (!result.ok) {
              setError("This expense is already voided.");
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
