"use client";

import { useState } from "react";
import { Button } from "@/components/ds/button";

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Generic CSV export button for Reports pages (Phase 8 §41) — takes the
 * server action call as a thunk so each report just passes its own
 * already-filtered fetch, same pattern as the existing Expenses/Other
 * Income export buttons. */
export function ExportCsvButton({ filename, fetchCsv }: { filename: string; fetchCsv: () => Promise<string> }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const csv = await fetchCsv();
      download(filename, csv);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={run}>
      {busy ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
