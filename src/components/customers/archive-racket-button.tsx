"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { archiveRacketAction } from "@/app/customers/racket-actions";

export function ArchiveRacketButton({ customerId, racketId, archived }: { customerId: string; racketId: string; archived: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(archived);

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (!done && !confirm("Archive this racket? It disappears from the customer's active racket list but nothing is deleted, and it can be unarchived later.")) return;
        startTransition(async () => {
          await archiveRacketAction(customerId, racketId, !done);
          setDone((d) => !d);
          router.refresh();
        });
      }}
    >
      {done ? "Unarchive racket" : "Archive racket"}
    </Button>
  );
}
