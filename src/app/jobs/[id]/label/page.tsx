import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";
import { PrintButton } from "@/components/ds/print-button";

export const dynamic = "force-dynamic";

function formatFullDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Singapore" });
}

function formatTension(tension: string, unit: string): string {
  const n = Number(tension);
  const value = n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1);
  return `${value}${unit === "lb" ? "lbs" : "kg"}`;
}

function TennisBallIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M4.2 6.8C7 9 8.5 10.5 8.5 12s-1.5 3-4.3 5.2" />
      <path d="M19.8 6.8C17 9 15.5 10.5 15.5 12s1.5 3 4.3 5.2" />
    </svg>
  );
}

/** A racket tag for a Brother P-touch (12mm x 53mm tape), matching the
 * shop's existing label template: mascot + wordmark, date + job number,
 * a divider, then main/cross always shown as separate rows (string,
 * gauge, tension — even when main and cross are the identical string, a
 * full bed can still be strung at different tensions). Job number is the
 * bare 4-digit code (no "J" prefix) to match the existing template. */
export default async function JobLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const main = job.strings.find((s) => s.role === "main");
  const cross = job.strings.find((s) => s.role === "cross");
  const dateLine = formatFullDate(job.completedAt ?? job.receivedOn);
  const bareJobNumber = job.code.replace(/^J/, "");

  function stringRow(role: "M" | "C", s: typeof main) {
    if (!s) return null;
    return (
      <div className="label-string-row" key={role}>
        <span className="label-string-name">
          {role}: {s.brandSnapshot} {s.stringNameSnapshot} {s.gaugeSnapshot ? Number(s.gaugeSnapshot).toFixed(2) : ""}
        </span>
        <span className="label-tension">{formatTension(s.tension, s.tensionUnit)}</span>
      </div>
    );
  }

  return (
    <div className="label-wrap">
      <PrintButton icon="scan-line" />
      <div className="label-print">
        <div className="label-mascot-col">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size
              print label at an exact physical mm size; next/image's
              responsive/lazy-load behavior has no benefit here. */}
          <img src="/racket-label-mascot.png" alt="" className="label-mascot" />
          <div className="label-logo">SportCraft</div>
        </div>
        <div className="label-content-col">
          <div className="label-top-row">
            <span className="label-date">
              <TennisBallIcon /> {dateLine}
            </span>
            <span className="label-job-number">{bareJobNumber}</span>
          </div>
          <div className="label-divider" />
          {stringRow("M", main)}
          {stringRow("C", cross)}
        </div>
      </div>
    </div>
  );
}
