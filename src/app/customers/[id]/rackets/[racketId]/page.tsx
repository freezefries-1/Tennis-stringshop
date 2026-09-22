import { notFound } from "next/navigation";
import Link from "next/link";
import { getRacket, racketLabel } from "@/lib/rackets";
import { listJobsForRacket } from "@/lib/jobs";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { IconButton } from "@/components/ds/icon-button";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { PromoteRacketButton } from "@/components/customers/promote-racket-button";
import { ArchiveRacketButton } from "@/components/customers/archive-racket-button";
import { DeleteRacketButton } from "@/components/customers/delete-racket-button";
import { formatCents, formatDate } from "@/lib/format";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE } from "@/components/jobs/job-status";

export const dynamic = "force-dynamic";

export default async function RacketProfilePage({ params }: { params: Promise<{ id: string; racketId: string }> }) {
  const { id, racketId } = await params;
  const [found, jobs] = await Promise.all([getRacket(racketId), listJobsForRacket(racketId)]);
  if (!found || found.racket.customerId !== id) notFound();
  const { racket, owner } = found;
  const lastJob = jobs[0] ?? null;

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
          {lastJob ? (
            <Link href={`/jobs/new?customerId=${id}&racketId=${racketId}&repeat=1`}>
              <Button size="sm" variant="secondary">
                Repeat previous setup
              </Button>
            </Link>
          ) : null}
          <Link href={`/jobs/new?customerId=${id}&racketId=${racketId}`}>
            <Button size="sm" variant="secondary" iconLeft="plus">
              New string job
            </Button>
          </Link>
          <Link href={`/customers/${id}/rackets/${racketId}/edit`}>
            <IconButton icon="pencil" label="Edit racket" variant="outline" size="sm" />
          </Link>
          <ArchiveRacketButton customerId={id} racketId={racketId} archived={!!racket.archivedAt} />
          <DeleteRacketButton customerId={id} racketId={racketId} />
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
            Last string setup
          </div>
          {lastJob ? (
            <SpecList
              dense
              items={[
                { label: "String", value: lastJob.mainString === lastJob.crossString ? lastJob.mainString : `${lastJob.mainString} / ${lastJob.crossString}` },
                {
                  label: "Tension",
                  value: lastJob.mainTension === lastJob.crossTension ? `${lastJob.mainTension} ${lastJob.tensionUnit}` : `${lastJob.mainTension ?? "?"} / ${lastJob.crossTension ?? "?"} ${lastJob.tensionUnit}`,
                },
                { label: "Number of knots", value: lastJob.numberOfKnots ?? "—" },
                { label: "Date", value: formatDate(lastJob.receivedOn) },
              ]}
            />
          ) : (
            <div className="row-s">No string jobs on file yet.</div>
          )}

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Stringing history · {jobs.length}
          </div>
          {jobs.length === 0 ? (
            <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", paddingTop: 8 }}>
              <span>No string jobs on file yet.</span>
              <Link href={`/jobs/new?customerId=${id}&racketId=${racketId}`}>
                <Button size="sm" variant="secondary" iconLeft="plus">
                  New string job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rows">
              {jobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="row">
                  <div className="row-main">
                    <div className="row-t">{j.mainString === j.crossString ? j.mainString : `${j.mainString} / ${j.crossString}`}</div>
                    <div className="row-s num">
                      {formatDate(j.receivedOn)} · {j.mainTension === j.crossTension ? `${j.mainTension} ${j.tensionUnit}` : `${j.mainTension ?? "?"} / ${j.crossTension ?? "?"} ${j.tensionUnit}`}
                      {j.numberOfKnots ? ` · ${j.numberOfKnots} knots` : ""}
                    </div>
                  </div>
                  <div className="row-end">
                    <span className="row-s num">{formatCents(j.finalPriceCents)}</span>
                    <Badge tone={JOB_STATUS_TONE[j.status]} dot>
                      {JOB_STATUS_LABEL[j.status]}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
