"use client";

import { useState } from "react";
import { Button } from "@/components/ds/button";
import { exportExpensesCsvAction } from "@/app/expenses/actions";
import type { ExpenseFilters } from "@/lib/expenses";

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Exports whatever the current filters are currently showing (brief §42) —
 * not just the current page, the whole filtered set. */
export function ExportCsvButton({ filters }: { filters: ExpenseFilters }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const csv = await exportExpensesCsvAction(filters);
    download(`expenses-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setBusy(false);
  }

  return (
    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={run}>
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
