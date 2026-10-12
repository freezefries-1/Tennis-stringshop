"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { archiveCustomerAction } from "@/app/customers/actions";

export function ArchiveCustomerButton({ customerId, archived }: { customerId: string; archived: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(archived);

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        if (!done && !confirm("Archive this customer? They disappear from the active customer list but nothing is deleted, and it can be unarchived later.")) return;
        startTransition(async () => {
          await archiveCustomerAction(customerId, !done);
          setDone((d) => !d);
          router.refresh();
        });
      }}
    >
      {done ? "Unarchive customer" : "Archive customer"}
    </Button>
  );
}
