"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { setProductArchivedAction } from "@/app/products/actions";

/** Archived products stay selectable on historical sales/movements —
 * this only removes them from the POS product picker and the default
 * Products list. */
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
        if (!done && !confirm("Archive this product? It stops appearing as selectable in POS for new sales, but stays visible on historical records and can be unarchived later.")) return;
        startTransition(async () => {
          await setProductArchivedAction(productId, !done);
          setDone((d) => !d);
          router.refresh();
        });
      }}
    >
      {done ? "Unarchive product" : "Archive product"}
    </Button>
  );
}
