"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { fetchCustomersForSalePicker, updateSaleCustomerAction } from "@/app/sales/actions";
import type { PickerCustomer } from "@/lib/sales";

/** Corrects who a sale is attributed to — most commonly a sale that was
 * wrongly left as a walk-in (a typed name that was never actually selected
 * at checkout used to be silently discarded — see PosCustomerPicker). Not
 * offered at all on a job-linked sale (stringJobId set), since that sale's
 * customer always matches its job's own customer — fix the job instead. */
export function EditSaleCustomerButton({
  saleId,
  currentCustomer,
  stringJobLinked,
  isReversal,
}: {
  saleId: string;
  currentCustomer: PickerCustomer | null;
  stringJobLinked: boolean;
  isReversal: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PickerCustomer[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // A cleared search box just hides the (possibly stale) results below —
    // see the `q.trim()` check in the render — so there's nothing to reset
    // here synchronously (same reasoning as PosCustomerPicker's own effect).
    const query = q.trim();
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      const r = await fetchCustomersForSalePicker(query);
      if (active) setResults(r);
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  if (stringJobLinked || isReversal) return null;

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Edit customer
      </Button>
    );
  }

  async function apply(customerId: string | null) {
    setSaving(true);
    setError(null);
    const result = await updateSaleCustomerAction(saleId, customerId);
    setSaving(false);
    if (!result.ok) {
      setError(result.reason === "job_linked" ? "This sale is linked to a string job and always uses that job's customer." : "This is a return record — its customer always matches the original sale.");
      return;
    }
    setOpen(false);
    setQ("");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <Field label="Customer">
        <div style={{ position: "relative" }}>
          <Input placeholder="Search name, phone or customer ID…" value={q} onChange={(e) => setQ(e.target.value)} disabled={saving} style={{ width: "100%" }} />
          {q.trim() ? (
            <div className="results" style={{ maxHeight: 200 }}>
              {results.length === 0 ? (
                <div className="res-empty">No match for &ldquo;{q.trim()}&rdquo;.</div>
              ) : (
                results.map((c) => (
                  <button key={c.id} type="button" className="res" disabled={saving} onClick={() => apply(c.id)}>
                    <span className="res-t">{c.name}</span>
                    <span className="res-s num">
                      {c.code} · {c.phone}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {currentCustomer ? (
          <Button size="sm" variant="secondary" disabled={saving} onClick={() => apply(null)}>
            Set to walk-in
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          disabled={saving}
          onClick={() => {
            setOpen(false);
            setQ("");
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
