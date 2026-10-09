"use client";

import { Button } from "@/components/ds/button";

/** Shared by every printable page (Sale receipt, String Job label, …) —
 * each such page is itself responsible for printing cleanly (AppShell
 * skips the sidebar/top bar for these routes; the page's own CSS sets
 * @page size/margins), this button just triggers the browser dialog. */
export function PrintButton({ icon = "receipt" }: { icon?: string }) {
  return (
    <Button size="sm" variant="secondary" iconLeft={icon} onClick={() => window.print()}>
      Print
    </Button>
  );
}
