import { notFound } from "next/navigation";
import Link from "next/link";
import { getJob } from "@/lib/jobs";
import { racketLabel } from "@/lib/racket-label";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { formatCents, formatDate } from "@/lib/format";
import { ChangeStatusControl } from "@/components/jobs/change-status-control";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/components/jobs/job-status";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const main = job.strings.find((s) => s.role === "main");
  const cross = job.strings.find((s) => s.role === "cross");
  const sameString = main && cross && main.brandSnapshot === cross.brandSnapshot && main.stringNameSnapshot === cross.stringNameSnapshot;
  const sameTension = main?.tension === cross?.tension;

  const subtotalCents = job.services.reduce((sum, s) => sum + s.totalCents, 0);

  const jobItems: SpecListItem[] = [
    { label: "Status", value: <Badge tone={JOB_STATUS_TONE[job.status]} dot>{JOB_STATUS_LABEL[job.status]}</Badge> },
    { label: "Date received", value: formatDate(job.receivedOn) },
    { label: "Due date", value: job.dueOn ? formatDate(job.dueOn) : "—" },
    { label: "Completed", value: job.completedAt ? formatDate(job.completedAt) : "—" },
    { label: "Collected", value: job.collectedAt ? formatDate(job.collectedAt) : "—" },
  ];

  const customerItems: SpecListItem[] = [
    { label: "Name", value: <Link href={`/customers/${job.customerId}`} style={{ color: "var(--court-600)" }}>{job.customer.name}</Link> },
    { label: "Phone", value: job.customer.phone },
    { label: "Customer ID", value: <span className="num">{job.customer.code}</span> },
  ];

  const racketItems: SpecListItem[] = [
    { label: "Racket ID", value: <span className="num">{job.racket.code}</span> },
    { label: "Brand", value: job.racket.effectiveBrand ?? "—" },
    { label: "Series", value: job.racket.effectiveSeries ?? "—" },
    { label: "Model", value: job.racket.effectiveModel ?? "—" },
    { label: "Generation / year", value: [job.racket.effectiveGenerationName, job.racket.effectiveGenerationYear].filter(Boolean).join(" / ") || "—" },
    ...(job.racket.nickname ? [{ label: "Nickname", value: job.racket.nickname }] : []),
  ];

  const stringItems: SpecListItem[] = sameString
    ? [
        { label: "String", value: `${main.brandSnapshot} ${main.stringNameSnapshot}${main.customerSupplied ? " (customer supplied)" : ""}` },
        { label: "Gauge", value: main.gaugeSnapshot ? `${main.gaugeSnapshot} mm` : "—" },
        { label: "Colour", value: main.colourSnapshot ?? "—" },
        { label: "Tension", value: sameTension ? `${main.tension} ${main.tensionUnit}` : `${main.tension} / ${cross?.tension} ${main.tensionUnit}` },
      ]
    : [
        { label: "Main string", value: main ? `${main.brandSnapshot} ${main.stringNameSnapshot}${main.customerSupplied ? " (customer supplied)" : ""}` : "—" },
        { label: "Main gauge / colour", value: main ? [main.gaugeSnapshot ? `${main.gaugeSnapshot} mm` : null, main.colourSnapshot].filter(Boolean).join(" · ") || "—" : "—" },
        { label: "Main tension", value: main ? `${main.tension} ${main.tensionUnit}` : "—" },
        { label: "Cross string", value: cross ? `${cross.brandSnapshot} ${cross.stringNameSnapshot}${cross.customerSupplied ? " (customer supplied)" : ""}` : "—" },
        { label: "Cross gauge / colour", value: cross ? [cross.gaugeSnapshot ? `${cross.gaugeSnapshot} mm` : null, cross.colourSnapshot].filter(Boolean).join(" · ") || "—" : "—" },
        { label: "Cross tension", value: cross ? `${cross.tension} ${cross.tensionUnit}` : "—" },
      ];
  stringItems.push(
    { label: "Number of knots", value: job.numberOfKnots ?? "—" },
    { label: "Pre-stretch", value: job.preStretchType === "none" ? "None" : `${job.preStretchType === "manual" ? "Manual" : "Machine"}${job.preStretchPct ? ` · ${job.preStretchPct}%` : ""}` },
  );

  const paymentItems: SpecListItem[] = [
    { label: "Payment status", value: <Badge tone={PAYMENT_STATUS_TONE[job.paymentStatus]}>{PAYMENT_STATUS_LABEL[job.paymentStatus]}</Badge> },
    { label: "Payment method", value: job.paymentMethod ? job.paymentMethod.charAt(0).toUpperCase() + job.paymentMethod.slice(1) : "—" },
  ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="profile-id num">{job.code}</div>
          <h2 className="profile-name">
            {racketLabel({ brand: job.racket.effectiveBrand, series: job.racket.effectiveSeries, model: job.racket.effectiveModel, generationYear: job.racket.effectiveGenerationYear, generationName: job.racket.effectiveGenerationName })}
          </h2>
          <div className="row-s" style={{ marginTop: 4 }}>
            <Link href={`/customers/${job.customerId}`} style={{ color: "var(--court-600)" }}>
              {job.customer.name}
            </Link>
            {" · "}
            <Link href={`/customers/${job.customerId}/rackets/${job.customerRacketId}`} style={{ color: "var(--court-600)" }}>
              {job.racket.code}
            </Link>
          </div>
        </div>
        <div className="profile-actions">
          <Link href={`/jobs/new?customerId=${job.customerId}&racketId=${job.customerRacketId}&repeatFromJob=${job.id}`}>
            <Button size="sm" variant="secondary" iconLeft="plus">
              Repeat / duplicate job
            </Button>
          </Link>
          <Link href={`/jobs/${job.id}/edit`}>
            <Button size="sm" variant="secondary" iconLeft="pencil">
              Edit job
            </Button>
          </Link>
          <DeleteJobButton jobId={job.id} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ChangeStatusControl jobId={job.id} status={job.status} />
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Job
          </div>
          <SpecList dense items={jobItems} />

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Customer
          </div>
          <SpecList dense items={customerItems} />

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Racket
          </div>
          <SpecList dense items={racketItems} />

          {job.generalNotes ? (
            <>
              <div className="lab" style={{ marginTop: 20, marginBottom: 6 }}>
                General notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{job.generalNotes}</p>
            </>
          ) : null}
          {job.stringingNotes ? (
            <>
              <div className="lab" style={{ marginTop: 16, marginBottom: 6 }}>
                Internal stringing notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{job.stringingNotes}</p>
            </>
          ) : null}
        </Card>

        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            String setup · {job.setupType === "full" ? "Full bed" : "Hybrid"}
          </div>
          <SpecList dense items={stringItems} />

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Services
          </div>
          {job.services.length === 0 ? (
            <div className="row-s">No services recorded.</div>
          ) : (
            <SpecList
              dense
              items={job.services.map((s) => ({
                label: s.serviceName + (Number(s.quantity) !== 1 ? ` ×${s.quantity}` : ""),
                value: <span className="num">{formatCents(s.totalCents)}</span>,
              }))}
            />
          )}

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Pricing
          </div>
          <SpecList
            dense
            items={[
              { label: "Subtotal", value: <span className="num">{formatCents(subtotalCents)}</span> },
              { label: "Discount", value: <span className="num">−{formatCents(job.discountCents)}</span> },
            ]}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--ink-100)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>
            <span>Total</span>
            <span className="num">{formatCents(job.finalPriceCents)}</span>
          </div>

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Payment
          </div>
          <SpecList dense items={paymentItems} />
        </Card>
      </div>
    </div>
  );
}
