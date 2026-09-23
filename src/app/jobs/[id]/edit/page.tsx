import { notFound } from "next/navigation";
import { getJob } from "@/lib/jobs";
import { getStringUsageDefaults } from "@/lib/settings";
import { JobForm } from "@/components/jobs/job-form";
import { CancelJobButton } from "@/components/jobs/cancel-job-button";
import { updateJobAction } from "@/app/jobs/actions";
import { toStringLine, type JobFormState } from "@/lib/job-form-types";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, stringUsageDefaults] = await Promise.all([getJob(id), getStringUsageDefaults()]);
  if (!job) notFound();

  const main = job.strings.find((s) => s.role === "main");
  const cross = job.strings.find((s) => s.role === "cross");

  const initialState: JobFormState = {
    status: "idle",
    values: {
      customerId: job.customerId,
      customerRacketId: job.customerRacketId,
      setupType: job.setupType,
      receivedOn: job.receivedOn,
      dueOn: job.dueOn ?? "",
      numberOfKnots: job.numberOfKnots != null ? String(job.numberOfKnots) : "",
      preStretchType: job.preStretchType,
      preStretchPct: job.preStretchPct ?? "",
      paymentStatus: job.paymentStatus,
      paymentMethod: job.paymentMethod ?? "",
      discount: job.discountCents ? (job.discountCents / 100).toFixed(2) : "",
      generalNotes: job.generalNotes ?? "",
      stringingNotes: job.stringingNotes ?? "",
      main: toStringLine(main),
      cross: toStringLine(cross),
      services: job.services.length
        ? job.services.map((s) => ({ serviceName: s.serviceName, quantity: s.quantity, unitPrice: (s.unitPriceCents / 100).toFixed(2), notes: s.notes ?? "" }))
        : [{ serviceName: "", quantity: "1", unitPrice: "", notes: "" }],
    },
  };

  const initialCustomer = { id: job.customer.id, code: job.customer.code, name: job.customer.name, phone: job.customer.phone };

  return (
    <div className="ph-wrap" style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <h2 className="ph-title">Edit {job.code}</h2>
        <CancelJobButton jobId={id} status={job.status} />
      </div>
      <div style={{ marginTop: 16 }}>
        <JobForm
          mode="edit"
          jobId={id}
          action={updateJobAction.bind(null, id)}
          initialState={initialState}
          customers={[]}
          initialCustomer={initialCustomer}
          initialRacket={job.racket}
          stringUsageDefaults={stringUsageDefaults}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
