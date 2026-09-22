"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { linkRacketToExistingModelAction, promoteRacketToModelAction, type PromoteRacketResult } from "@/app/customers/racket-actions";

export function PromoteRacketButton({ customerId, racketId }: { customerId: string; racketId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [duplicate, setDuplicate] = useState<{ id: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<PromoteRacketResult>) => {
    startTransition(async () => {
      const result = await action();
      if (result.status === "duplicate" && result.existing) {
        setError(null);
        setDuplicate(result.existing);
      } else if (result.status === "error") {
        setDuplicate(null);
        setError(result.message ?? "Something went wrong.");
      } else {
        setDuplicate(null);
        setError(null);
        router.refresh();
      }
    });
  };

  if (duplicate) {
    return (
      <div className="form-warning" style={{ maxWidth: 420 }}>
        <p>
          A model matching this racket already exists: <strong>{duplicate.label}</strong>.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => linkRacketToExistingModelAction(customerId, racketId, duplicate.id))}>
            Use existing model
          </Button>
          <Button size="sm" disabled={pending} onClick={() => run(() => promoteRacketToModelAction(customerId, racketId, true))}>
            Create as new model
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDuplicate(null)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => promoteRacketToModelAction(customerId, racketId, false))}>
        {pending ? "Adding…" : "Add to racket database"}
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
    </div>
  );
}
