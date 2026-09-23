"use client";

import { useState } from "react";
import { Button } from "@/components/ds/button";
import { exportOtherIncomeCsvAction } from "@/app/other-income/actions";
import type { OtherIncomeFilters } from "@/lib/other-income";

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportOtherIncomeCsvButton({ filters }: { filters: OtherIncomeFilters }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const csv = await exportOtherIncomeCsvAction(filters);
    download(`other-income-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setBusy(false);
  }

  return (
    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={run}>
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
