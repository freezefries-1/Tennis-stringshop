import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";
import { formatDate } from "@/lib/format";
import { PrintButton } from "@/components/ds/print-button";

export const dynamic = "force-dynamic";

/** A racket tag for a Brother P-touch (12mm x 53mm tape) — just enough to
 * identify which racket this is mid-stack and trace it back to its job:
 * string + tension, job code + date. Customer/racket aren't on it (not
 * asked for, and there's no room at this size anyway) — the job code is
 * the lookup key back into the app for everything else. */
export default async function JobLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const main = job.strings.find((s) => s.role === "main");
  const cross = job.strings.find((s) => s.role === "cross");
  const sameString = main && cross && main.brandSnapshot === cross.brandSnapshot && main.stringNameSnapshot === cross.stringNameSnapshot;
  const sameTension = main?.tension === cross?.tension;

  const stringLine = !main
    ? "—"
    : sameString
      ? `${main.brandSnapshot} ${main.stringNameSnapshot} ${sameTension ? `${main.tension}${main.tensionUnit}` : `${main.tension}/${cross?.tension}${main.tensionUnit}`}`
      : `M:${main.brandSnapshot} ${main.tension}${main.tensionUnit} / X:${cross ? `${cross.brandSnapshot} ${cross.tension}${cross.tensionUnit}` : "—"}`;

  const dateLine = formatDate(job.completedAt ?? job.receivedOn);

  return (
    <div className="label-wrap">
      <PrintButton icon="scan-line" />
      <div className="label-print">
        <div className="label-logo">SportCraft</div>
        <div className="label-line">{stringLine}</div>
        <div className="label-line">
          {job.code} · {dateLine}
        </div>
      </div>
    </div>
  );
}
