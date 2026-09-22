"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { setStringProductArchivedAction } from "@/app/inventory/actions";

/** Archived products stay selectable on historical jobs/movements/reports
 * (brief §33) — this only removes them from the SportCraft Stock picker on
 * new string jobs and the default Inventory list. */
export function ArchiveProductButton({ productId, archived }: { productId: string; archived: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(archived);

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (!done && !confirm("Archive this string product? It stops appearing as selectable stock for new jobs, but stays visible on historical records and can be unarchived later.")) return;
        startTransition(async () => {
          await setStringProductArchivedAction(productId, !done);
          setDone((d) => !d);
          router.refresh();
        });
      }}
    >
      {done ? "Unarchive product" : "Archive product"}
    </Button>
  );
}
