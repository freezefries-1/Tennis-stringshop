import { notFound } from "next/navigation";
import Link from "next/link";
import { getModelWithNames, listCustomerRacketsForModel } from "@/lib/racket-catalogue";
import { racketLabel, formatStringPattern } from "@/lib/racket-label";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { ArchiveModelButton } from "@/components/catalogue/archive-model-button";

export const dynamic = "force-dynamic";

export default async function ModelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = await getModelWithNames(id);
  if (!model) notFound();
  const usedBy = await listCustomerRacketsForModel(id);

  const specItems: SpecListItem[] = [
    { label: "Head size", value: model.headSizeSqin ? `${model.headSizeSqin} sq in` : "—" },
    { label: "String pattern", value: formatStringPattern(model.stringPatternMains, model.stringPatternCrosses) ?? "—" },
    { label: "Standard weight", value: model.unstrungWeightG ? `${model.unstrungWeightG} g` : "—" },
    { label: "Standard balance", value: model.standardBalanceMm ? `${model.standardBalanceMm} mm` : "—" },
    { label: "Length", value: model.standardLengthIn ? `${model.standardLengthIn} in` : "—" },
    {
      label: "Recommended tension",
      value: model.recommendedTensionMinLbs || model.recommendedTensionMaxLbs ? `${model.recommendedTensionMinLbs ?? "?"}–${model.recommendedTensionMaxLbs ?? "?"} lbs` : "—",
    },
  ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="profile-id num">
            {model.brandName} · {model.seriesName}
          </div>
          <h2 className="profile-name">{racketLabel({ model: model.model, generationYear: model.generationYear, generationName: model.generationName })}</h2>
          {model.archivedAt ? <div className="row-s" style={{ marginTop: 4, color: "var(--signal-warning)" }}>Archived</div> : null}
        </div>
        <div className="profile-actions">
          <Link href={`/catalogue/models/${id}/edit`}>
            <Button size="sm" variant="secondary" iconLeft="pencil">
              Edit
            </Button>
          </Link>
          <ArchiveModelButton modelId={id} archived={!!model.archivedAt} />
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Specifications
          </div>
          <SpecList dense items={specItems} />
          {model.notes ? (
            <>
              <div className="lab" style={{ marginTop: 16, marginBottom: 6 }}>
                Notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{model.notes}</p>
            </>
          ) : null}
        </Card>

        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Customer rackets using this model · {usedBy.length}
          </div>
          {usedBy.length === 0 ? (
            <div className="rec-empty">No customer rackets linked to this model yet.</div>
          ) : (
            <SpecList
              dense
              items={usedBy.map((u) => ({
                label: u.code,
                value: (
                  <Link href={`/customers/${u.customerId}/rackets/${u.racketId}`} style={{ color: "var(--court-600)" }}>
                    {u.customerName}
                    {u.nickname ? ` · ${u.nickname}` : ""}
                  </Link>
                ),
              }))}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
