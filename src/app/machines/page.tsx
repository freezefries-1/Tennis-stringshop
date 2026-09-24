import { listMachines } from "@/lib/machines";
import { MachinesView } from "@/components/machines/machines-view";

export const dynamic = "force-dynamic";

export default async function MachinesPage() {
  const machines = await listMachines(true);
  return (
    <div className="ph-wrap" style={{ maxWidth: 720 }}>
      <h2 className="ph-title">Machines</h2>
      <p className="ph-body">
        Track which stringing machine did each job. Set a job&rsquo;s machine on its own page, then come back here to see how many jobs
        each machine has strung and when it&rsquo;s due for a clean.
      </p>
      <MachinesView machines={machines} />
    </div>
  );
}
