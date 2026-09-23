"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { formatCents, formatDate } from "@/lib/format";
import { parseExpenseImportCsvAction, importExpensesAction } from "@/app/expenses/actions";
import type { ExpenseImportRow } from "@/lib/expenses";

type Step = "upload" | "preview" | "done";

export function ImportView() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ExpenseImportRow[]>([]);
  const [included, setIncluded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setFileError(null);
    const text = await file.text();
    const parsed = await parseExpenseImportCsvAction(text);
    if (parsed.length === 0) {
      setFileError("No data rows found in that file.");
      return;
    }
    setRows(parsed);
    setIncluded(new Set(parsed.filter((r) => r.errors.length === 0).map((r) => r.rowIndex)));
    setStep("preview");
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const invalidCount = rows.length - validCount;

  if (step === "upload") {
    return (
      <Card padding="20px" style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
        <p className="row-s">
          Upload a CSV with columns: Date, Description, Category, Vendor, Amount, Payment Method, Reference, Notes. Categories must already exist — create them on the{" "}
          <Link href="/expenses/categories" style={{ color: "var(--court-600)" }}>
            categories page
          </Link>{" "}
          first. Rows that look like inventory purchases (string reels, rackets, stock) are flagged for review, not auto-imported.
        </p>
        {fileError ? <div className="form-warning"><p>{fileError}</p></div> : null}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </Card>
    );
  }

  if (step === "done" && result) {
    return (
      <Card padding="20px" style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
        <p>
          Imported <strong>{result.created}</strong> expense{result.created === 1 ? "" : "s"}
          {result.skipped > 0 ? `, skipped ${result.skipped}` : ""}.
        </p>
        <Button onClick={() => router.push("/expenses")}>Back to expenses</Button>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="row-s">
        {rows.length} rows parsed — {validCount} valid, {invalidCount} with errors. {included.size} selected to import.
      </div>
      <Card padding="0" style={{ overflowX: "auto" }}>
        <table className="dtable">
          <thead>
            <tr>
              <th></th>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.rowIndex}>
                <td>
                  <input
                    type="checkbox"
                    disabled={r.errors.length > 0}
                    checked={included.has(r.rowIndex)}
                    onChange={(e) =>
                      setIncluded((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(r.rowIndex);
                        else next.delete(r.rowIndex);
                        return next;
                      })
                    }
                  />
                </td>
                <td>{r.expenseDate ? formatDate(r.expenseDate) : "—"}</td>
                <td>{r.description || "—"}</td>
                <td>{r.categoryName || "—"}</td>
                <td>{r.vendor ?? "—"}</td>
                <td className="num">{r.amountCents ? formatCents(r.amountCents) : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {r.errors.map((e) => (
                      <Badge key={e} tone="danger">
                        {e}
                      </Badge>
                    ))}
                    {r.possibleDuplicate ? <Badge tone="warning">Possible duplicate</Badge> : null}
                    {r.looksLikeInventory ? <Badge tone="warning">Looks like inventory — review</Badge> : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          disabled={busy || included.size === 0}
          onClick={async () => {
            setBusy(true);
            const toImport = rows.filter((r) => included.has(r.rowIndex)).map((r) => ({ expenseDate: r.expenseDate, description: r.description, categoryName: r.categoryName, vendor: r.vendor, amountCents: r.amountCents, paymentMethod: r.paymentMethod, referenceNumber: r.referenceNumber, notes: r.notes }));
            const res = await importExpensesAction(toImport);
            setBusy(false);
            setResult(res);
            setStep("done");
          }}
        >
          {busy ? "Importing…" : `Import ${included.size} expense${included.size === 1 ? "" : "s"}`}
        </Button>
        <Button variant="ghost" onClick={() => setStep("upload")} disabled={busy}>
          Start over
        </Button>
      </div>
    </div>
  );
}
