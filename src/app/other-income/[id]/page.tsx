import { notFound } from "next/navigation";
import Link from "next/link";
import { getOtherIncome, listOtherIncomeAuditLog } from "@/lib/other-income";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { formatCents, formatDate } from "@/lib/format";
import { VoidOtherIncomeButton } from "@/components/other-income/void-other-income-button";
import { OTHER_INCOME_STATUS_LABEL, OTHER_INCOME_STATUS_TONE } from "@/components/other-income/other-income-status";

export const dynamic = "force-dynamic";

function auditFieldSummary(values: unknown): string {
  if (!values || typeof values !== "object") return "—";
  const v = values as Record<string, unknown>;
  const parts: string[] = [];
  if ("amountCents" in v) parts.push(`Amount ${formatCents(Number(v.amountCents))}`);
  if ("incomeDate" in v) parts.push(`Date ${v.incomeDate}`);
  if ("description" in v) parts.push(`"${v.description}"`);
  if ("category" in v) parts.push(`Category "${v.category}"`);
  if ("status" in v) parts.push(`Status ${v.status}`);
  return parts.join(" · ") || "—";
}

const DIFF_ACTIONS = new Set(["updated", "category_renamed"]);
function auditActionLabel(action: string): string {
  return action.replace(/_/g, " ");
}

export default async function OtherIncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const income = await getOtherIncome(id);
  if (!income) notFound();

  const auditLog = await listOtherIncomeAuditLog(id);

  const infoItems: SpecListItem[] = [
    { label: "Income number", value: <span className="num">{income.incomeNumber}</span> },
    { label: "Date", value: formatDate(income.incomeDate) },
    { label: "Description", value: income.description },
    { label: "Category", value: income.category },
    { label: "Source", value: income.source ?? "—" },
    { label: "Amount", value: <span className="num">{formatCents(income.amountCents)}</span> },
    { label: "Payment method", value: income.paymentMethod ?? "—" },
    { label: "Reference number", value: income.referenceNumber ?? "—" },
    { label: "Status", value: <Badge tone={OTHER_INCOME_STATUS_TONE[income.status]} dot>{OTHER_INCOME_STATUS_LABEL[income.status]}</Badge> },
    { label: "Notes", value: income.notes ?? "—" },
  ];

  if (income.status === "voided") {
    infoItems.push({ label: "Voided at", value: income.voidedAt ? formatDate(income.voidedAt) : "—" }, { label: "Void reason", value: income.voidReason ?? "—" });
  }

  return (
    <div className="ph-wrap" style={{ maxWidth: 720 }}>
      <div className="profile-head">
        <div>
          <div className="row-s">{income.status === "voided" ? "Voided" : "Recorded"}</div>
          <h2 className="profile-name">{income.description}</h2>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {income.status === "recorded" ? (
            <Link href={`/other-income/${income.id}/edit`}>
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

      {income.status === "recorded" ? (
        <Card padding="16px" style={{ marginBottom: 16 }}>
          <VoidOtherIncomeButton incomeId={income.id} />
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
                  <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{auditActionLabel(row.action)}</span>
                  <span className="row-s">{formatDate(row.createdAt)}</span>
                </div>
                {DIFF_ACTIONS.has(row.action) ? (
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
