import { notFound } from "next/navigation";
import Link from "next/link";
import { getExpense, listExpenseAuditLog } from "@/lib/expenses";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { formatCents, formatDate } from "@/lib/format";
import { VoidExpenseButton } from "@/components/expenses/void-expense-button";
import { EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, EXPENSE_TREATMENT_LABEL, EXPENSE_TREATMENT_TONE } from "@/components/expenses/expense-status";

export const dynamic = "force-dynamic";

function auditFieldSummary(values: unknown): string {
  if (!values || typeof values !== "object") return "—";
  const v = values as Record<string, unknown>;
  const parts: string[] = [];
  if ("amountCents" in v) parts.push(`Amount ${formatCents(Number(v.amountCents))}`);
  if ("expenseDate" in v) parts.push(`Date ${v.expenseDate}`);
  if ("description" in v) parts.push(`"${v.description}"`);
  if ("status" in v) parts.push(`Status ${v.status}`);
  return parts.join(" · ") || "—";
}

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpense(id);
  if (!expense) notFound();

  const auditLog = await listExpenseAuditLog(id);

  const infoItems: SpecListItem[] = [
    { label: "Expense number", value: <span className="num">{expense.expenseNumber}</span> },
    { label: "Date", value: formatDate(expense.expenseDate) },
    { label: "Description", value: expense.description },
    { label: "Category", value: expense.categoryName },
    { label: "Vendor / Payee", value: expense.vendor ?? "—" },
    { label: "Amount", value: <span className="num">{formatCents(expense.amountCents)}</span> },
    { label: "Payment method", value: expense.paymentMethod ?? "—" },
    { label: "Reference number", value: expense.referenceNumber ?? "—" },
    { label: "Treatment", value: <Badge tone={EXPENSE_TREATMENT_TONE[expense.treatment]} dot>{EXPENSE_TREATMENT_LABEL[expense.treatment]}</Badge> },
    { label: "Status", value: <Badge tone={EXPENSE_STATUS_TONE[expense.status]} dot>{EXPENSE_STATUS_LABEL[expense.status]}</Badge> },
    { label: "Recurring template", value: expense.recurringDescription && expense.recurringExpenseId ? <Link href={`/expenses/recurring/${expense.recurringExpenseId}/edit`} style={{ color: "var(--court-600)" }}>{expense.recurringDescription}</Link> : "One-off" },
    { label: "Receipt", value: expense.receiptUrl ? <a href={expense.receiptUrl} target="_blank" rel="noreferrer" style={{ color: "var(--court-600)" }}>View receipt</a> : "—" },
    { label: "Notes", value: expense.notes ?? "—" },
  ];

  if (expense.status === "voided") {
    infoItems.push({ label: "Voided at", value: expense.voidedAt ? formatDate(expense.voidedAt) : "—" }, { label: "Void reason", value: expense.voidReason ?? "—" });
  }

  return (
    <div className="ph-wrap" style={{ maxWidth: 720 }}>
      <div className="profile-head">
        <div>
          <div className="row-s">{expense.status === "voided" ? "Voided" : "Recorded"}</div>
          <h2 className="profile-name">{expense.description}</h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {expense.status === "recorded" ? (
            <Link href={`/expenses/${expense.id}/edit`}>
              <Button size="sm" variant="secondary">
                Edit
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      <Card padding="20px" style={{ marginBottom: 16 }}>
        <SpecList dense items={infoItems} />
      </Card>

      {expense.status === "recorded" ? (
        <Card padding="16px" style={{ marginBottom: 16 }}>
          <VoidExpenseButton expenseId={expense.id} />
        </Card>
      ) : null}

      {auditLog.length > 0 ? (
        <Card padding="16px">
          <div className="lab" style={{ marginBottom: 10 }}>
            Audit history
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {auditLog.map((row) => (
              <div key={row.id} style={{ fontSize: 13.5, borderTop: "1px solid var(--border-hairline)", paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{row.action}</span>
                  <span className="row-s">{formatDate(row.createdAt)}</span>
                </div>
                {row.action === "updated" ? (
                  <div className="row-s" style={{ marginTop: 2 }}>
                    {auditFieldSummary(row.oldValues)} → {auditFieldSummary(row.newValues)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
