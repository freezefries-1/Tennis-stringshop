import { notFound } from "next/navigation";
import Link from "next/link";
import { getRacket, racketLabel } from "@/lib/rackets";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { IconButton } from "@/components/ds/icon-button";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";

export const dynamic = "force-dynamic";

export default async function RacketProfilePage({ params }: { params: Promise<{ id: string; racketId: string }> }) {
  const { id, racketId } = await params;
  const found = await getRacket(racketId);
  if (!found || found.racket.customerId !== id) notFound();
  const { racket, owner } = found;

  const specItems: SpecListItem[] = [
    { label: "Head size", value: racket.headSizeSqin ? `${racket.headSizeSqin} sq in` : "—" },
    { label: "String pattern", value: racket.stringPattern ?? "—" },
    { label: "Grip size", value: racket.gripSize ?? "—" },
    { label: "Static weight", value: racket.staticWeightG ? `${racket.staticWeightG} g` : "—" },
    { label: "Swingweight", value: racket.swingweight ?? "—" },
    { label: "Balance", value: racket.balanceMm ? `${racket.balanceMm} mm` : "—" },
  ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="profile-id num">{racket.code}</div>
          <h2 className="profile-name">{racketLabel(racket)}</h2>
          <div className="row-s" style={{ marginTop: 4 }}>
            Owner:{" "}
            <Link href={`/customers/${owner.id}`} style={{ color: "var(--court-600)" }}>
              {owner.name}
            </Link>
          </div>
        </div>
        <div className="profile-actions">
          <Link href="/jobs">
            <Button size="sm" variant="secondary">
              New string job
            </Button>
          </Link>
          <Link href={`/customers/${id}/rackets/${racketId}/edit`}>
            <IconButton icon="pencil" label="Edit racket" variant="outline" size="sm" />
          </Link>
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Specifications
          </div>
          <SpecList dense items={specItems} />
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
