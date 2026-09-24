import { getCustomer, listCustomers } from "@/lib/customers";
import { getRacket } from "@/lib/rackets";
import { getPreviousJobForRacket, getJobSetupForRepeat } from "@/lib/jobs";
import { getStringUsageDefaults } from "@/lib/settings";
import { listMachineOptions } from "@/lib/machines";
import { JobForm } from "@/components/jobs/job-form";
import { createJobAction } from "@/app/jobs/actions";
import { applyRepeatToValues, emptyJobFormState, type JobFormState } from "@/lib/job-form-types";

export const dynamic = "force-dynamic";

export default async function NewJobPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const customerId = str(sp.customerId);
  const racketId = str(sp.racketId);
  const repeat = sp.repeat === "1";
  const repeatFromJob = str(sp.repeatFromJob);

  const [allCustomers, customerRow, racketResult, stringUsageDefaults, machineOptions] = await Promise.all([
    listCustomers(),
    customerId ? getCustomer(customerId) : Promise.resolve(null),
    racketId ? getRacket(racketId) : Promise.resolve(null),
    getStringUsageDefaults(),
    listMachineOptions(),
  ]);

  const customers = allCustomers.map((c) => ({ id: c.id, code: c.code, name: c.name, phone: c.phone }));
  const initialCustomer = customerRow ? { id: customerRow.id, code: customerRow.code, name: customerRow.name, phone: customerRow.phone } : null;
  const initialRacket = racketResult?.racket ?? null;

  const today = new Date().toISOString().slice(0, 10);
  let initialState: JobFormState = emptyJobFormState(today);

  if (repeatFromJob) {
    const setup = await getJobSetupForRepeat(repeatFromJob);
    if (setup) initialState = { status: "idle", values: applyRepeatToValues(initialState.values, setup) };
  } else if (repeat && racketId) {
    const setup = await getPreviousJobForRacket(racketId);
    if (setup) initialState = { status: "idle", values: applyRepeatToValues(initialState.values, setup) };
  }

  return (
    <div className="ph-wrap" style={{ maxWidth: 1100 }}>
      <h2 className="ph-title">New string job</h2>
      <div style={{ marginTop: 16 }}>
        <JobForm mode="create" action={createJobAction} initialState={initialState} customers={customers} initialCustomer={initialCustomer} initialRacket={initialRacket} stringUsageDefaults={stringUsageDefaults} machineOptions={machineOptions} submitLabel="Save job" />
      </div>
    </div>
  );
}
