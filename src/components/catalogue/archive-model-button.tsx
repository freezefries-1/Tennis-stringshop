"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ds/button";
import { archiveModelAction } from "@/app/catalogue/actions";

export function ArchiveModelButton({ modelId, archived }: { modelId: string; archived: boolean }) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(archived);

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (!done && !confirm("Archive this racket model? It stays visible on any customer racket that already uses it, and can be un-archived later.")) return;
        startTransition(async () => {
          await archiveModelAction(modelId, !done);
          setDone((d) => !d);
        });
      }}
    >
      {done ? "Unarchive" : "Archive"}
    </Button>
  );
}
