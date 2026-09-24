"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setJobMachineAction } from "@/app/jobs/actions";
import type { MachineOption } from "@/lib/machines";

/** Which stringing machine did this job — settable any time, independent of
 * status, same inline-select-that-saves-itself pattern as
 * ChangePaymentStatusControl. Machine job counts (src/lib/machines.ts) are
 * derived from this column at read time, so setting it here is the only
 * write path that ever needs to exist. */
export function MachineSelect({ jobId, machineId, options }: { jobId: string; machineId: string | null; options: MachineOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(machineId ?? "");

  const setMachine = (id: string) => {
    startTransition(async () => {
      await setJobMachineAction(jobId, id || null);
      setCurrent(id);
      router.refresh();
    });
  };

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => setMachine(e.target.value)}
      style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 }}
    >
      <option value="">Not recorded</option>
      {options.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
