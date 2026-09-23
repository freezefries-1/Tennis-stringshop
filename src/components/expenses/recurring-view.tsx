"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { formatCents, formatDate } from "@/lib/format";
import { generateDueExpenseAction, generateAllDueExpensesAction, setRecurringExpenseActiveAction } from "@/app/expenses/recurring/actions";
import { RECURRING_FREQUENCY_LABEL } from "./expense-status";
import type { RecurringExpenseRow } from "@/lib/recurring-expenses";

export function RecurringView({ recurring: initial }: { recurring: RecurringExpenseRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [showInactive, setShowInactive] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const visible = rows.filter((r) => showInactive || r.active);
  const dueCount = rows.filter((r) => r.isDue).length;

  async function generateOne(id: string) {
    setBusyId(id);
    await generateDueExpenseAction(id);
    setBusyId(null);
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    setBusyId(id);
    await setRecurringExpenseActiveAction(id, !active);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, active: !active } : r)));
    setBusyId(null);
  }

  return (
    <div className="rec-wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-600)" }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show paused templates
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {dueCount > 0 ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={busyAll}
              onClick={async () => {
                setBusyAll(true);
                await generateAllDueExpensesAction();
                setBusyAll(false);
                router.refresh();
              }}
            >
              {busyAll ? "Generating…" : `Generate ${dueCount} due expense${dueCount === 1 ? "" : "s"}`}
            </Button>
          ) : null}
          <Link href="/expenses/recurring/new">
            <Button size="sm" iconLeft="plus">
              Add recurring expense
            </Button>
          </Link>
        </div>
      </div>

      {visible.length === 0 ? (
        <Card>
          <div className="rec-empty">No recurring expenses yet.</div>
        </Card>
      ) : (
        <Card padding="0">
          <div style={{ overflowX: "auto" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Frequency</th>
                  <th>Next due</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id}>
                    <td>{r.description}</td>
                    <td>{r.vendor ?? "—"}</td>
                    <td>{r.categoryName}</td>
                    <td>{RECURRING_FREQUENCY_LABEL[r.frequency]}</td>
                    <td className="num">{formatDate(r.nextDueDate)}</td>
                    <td>
                      {!r.active ? (
                        <Badge tone="neutral" dot>
                          Paused
                        </Badge>
                      ) : r.isDue ? (
                        <Badge tone="warning" dot>
                          Due
                        </Badge>
                      ) : (
                        <Badge tone="success" dot>
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="num">{formatCents(r.amountCents)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {r.isDue ? (
                          <Button size="sm" disabled={busyId === r.id} onClick={() => generateOne(r.id)}>
                            Create due expense
                          </Button>
                        ) : null}
                        <Link href={`/expenses/recurring/${r.id}/edit`}>
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" disabled={busyId === r.id} onClick={() => toggleActive(r.id, r.active)}>
                          {r.active ? "Pause" : "Resume"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
