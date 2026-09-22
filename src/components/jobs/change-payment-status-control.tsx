"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { changePaymentStatusAction } from "@/app/jobs/actions";
import { PAYMENT_STATUS_LABEL } from "./job-status";
import type { JobPaymentStatus } from "@/lib/jobs";

const PAYMENT_STATUSES: JobPaymentStatus[] = ["unpaid", "partially_paid", "paid"];

export function ChangePaymentStatusControl({ jobId, paymentStatus }: { jobId: string; paymentStatus: JobPaymentStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(paymentStatus);

  const setStatus = (s: JobPaymentStatus) => {
    startTransition(async () => {
      await changePaymentStatusAction(jobId, s);
      setCurrent(s);
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select
        value={current}
        disabled={pending}
        onChange={(e) => setStatus(e.target.value as JobPaymentStatus)}
        style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 }}
      >
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {PAYMENT_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {current !== "paid" ? (
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => setStatus("paid")}>
          Mark paid
        </Button>
      ) : null}
    </div>
  );
}
