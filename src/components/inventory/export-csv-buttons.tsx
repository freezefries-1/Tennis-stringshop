"use client";

import { useState } from "react";
import { Button } from "@/components/ds/button";
import { exportBatchesCsvAction, exportMovementsCsvAction, exportProductsCsvAction } from "@/app/inventory/actions";

function download(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Backup/audit/spreadsheet-analysis exports (brief §45) — string products,
 * batches and movements each as their own file. */
export function ExportCsvButtons() {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fetcher: () => Promise<string>, filename: string) => {
    setBusy(key);
    const csv = await fetcher();
    download(filename, csv);
    setBusy(null);
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Button size="sm" variant="ghost" disabled={busy === "products"} onClick={() => run("products", exportProductsCsvAction, "string-products.csv")}>
        {busy === "products" ? "Exporting…" : "Export products CSV"}
      </Button>
      <Button size="sm" variant="ghost" disabled={busy === "batches"} onClick={() => run("batches", exportBatchesCsvAction, "inventory-batches.csv")}>
        {busy === "batches" ? "Exporting…" : "Export batches CSV"}
      </Button>
      <Button size="sm" variant="ghost" disabled={busy === "movements"} onClick={() => run("movements", exportMovementsCsvAction, "inventory-movements.csv")}>
        {busy === "movements" ? "Exporting…" : "Export movements CSV"}
      </Button>
    </div>
  );
}
