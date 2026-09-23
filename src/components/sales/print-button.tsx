"use client";

import { Button } from "@/components/ds/button";

export function PrintButton() {
  return (
    <Button size="sm" variant="secondary" iconLeft="receipt" onClick={() => window.print()}>
      Print
    </Button>
  );
}
