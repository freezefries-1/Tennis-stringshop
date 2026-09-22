import { notFound } from "next/navigation";
import Link from "next/link";
import { getRacket, racketLabel } from "@/lib/rackets";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { IconButton } from "@/components/ds/icon-button";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { PromoteRacketButton } from "@/components/customers/promote-racket-button";
import { ArchiveRacketButton } from "@/components/customers/archive-racket-button";

export const dynamic = "force-dynamic";

export default async function RacketProfilePage({ params }: { params: Promise<{ id: string; racketId: string }> }) {
  const { id, racketId } = await params;
  const found = await getRacket(racketId);
  if (!found || found.racket.customerId !== id) notFound();
  const { racket, owner } = found;

  const actualItems: SpecListItem[] = [
    { label: "Grip size", value: racket.gripSize ?? "—" },
    { label: "Static weight", value: racket.staticWeightG ? `${racket.staticWeightG} g` : "—" },
    { label: "Swingweight", value: racket.swingweight ?? "—" },
    { label: "Balance", value: racket.balanceMm ? `${racket.balanceMm} mm` : "—" },
  ];

  const modelItems: SpecListItem[] = racket.linkedModel
    ? [
        { label: "Head size", value: racket.effectiveHeadSizeSqin ? `${racket.effectiveHeadSizeSqin} sq in` : "—" },
        { label: "String pattern", value: racket.effectiveStringPattern ?? "—" },
        { label: "Standard weight", value: racket.standardWeightG ? `${racket.standardWeightG} g` : "—" },
        { label: "Standard balance", value: racket.standardBalanceMm ? `${racket.standardBalanceMm} mm` : "—" },
        { label: "Length", value: racket.standardLengthIn ? `${racket.standardLengthIn} in` : "—" },
        {
          label: "Recommended tension",
          value: racket.tensionMinLbs || racket.tensionMaxLbs ? `${racket.tensionMinLbs ?? "?"}–${racket.tensionMaxLbs ?? "?"} lbs` : "—",
        },
      ]
    : [
        { label: "Head size", value: racket.effectiveHeadSizeSqin ? `${racket.effectiveHeadSizeSqin} sq in` : "—" },
        { label: "String pattern", value: racket.effectiveStringPattern ?? "—" },
      ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="profile-id num">{racket.code}</div>
          <h2 className="profile-name">
            {racketLabel({ brand: racket.effectiveBrand, series: racket.effectiveSeries, model: racket.effectiveModel, generationYear: racket.effectiveGenerationYear, generationName: racket.effectiveGenerationName })}
          </h2>
          <div className="row-s" style={{ marginTop: 4 }}>
            {racket.nickname ? <>{racket.nickname} · </> : null}
            Owner:{" "}
            <Link href={`/customers/${owner.id}`} style={{ color: "var(--court-600)" }}>
              {owner.name}
            </Link>
            {racket.linkedModel ? (
              <>
                {" "}
                · <Link href={`/catalogue/models/${racket.linkedModel.id}`} style={{ color: "var(--court-600)" }}>View racket model</Link>
              </>
            ) : null}
          </div>
          {racket.archivedAt ? (
            <div className="row-s" style={{ marginTop: 4, color: "var(--signal-warning)" }}>
              Archived
            </div>
          ) : null}
        </div>
        <div className="profile-actions">
          {!racket.linkedModel ? <PromoteRacketButton customerId={id} racketId={racketId} /> : null}
          <Link href="/jobs">
            <Button size="sm" variant="secondary">
              New string job
            </Button>
          </Link>
          <Link href={`/customers/${id}/rackets/${racketId}/edit`}>
            <IconButton icon="pencil" label="Edit racket" variant="outline" size="sm" />
          </Link>
          <ArchiveRacketButton customerId={id} racketId={racketId} archived={!!racket.archivedAt} />
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            {racket.linkedModel ? "Model specifications" : "Specifications"}
          </div>
          <SpecList dense items={modelItems} />

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Actual racket
          </div>
          <SpecList dense items={actualItems} />

          {racket.customisationNotes ? (
            <>
              <div className="lab" style={{ marginTop: 16, marginBottom: 6 }}>
                Customisation notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{racket.customisationNotes}</p>
            </>
          ) : null}
          {racket.notes ? (
            <>
              <div className="lab" style={{ marginTop: 16, marginBottom: 6 }}>
                General notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{racket.notes}</p>
            </>
          ) : null}
        </Card>

        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Stringing history
          </div>
          <SpecList
            dense
            items={[
              { label: "Number of string jobs", value: <span className="num">0</span> },
              { label: "Last string setup", value: "—" },
            ]}
          />
          <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", paddingTop: 24 }}>
            <span>Not tracked yet — Phase 4 adds job history here.</span>
            <Link href="/jobs">
              <Button size="sm" variant="secondary">
                New string job
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
