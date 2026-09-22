"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { CustomerPicker, type PickerCustomer } from "./customer-picker";
import { RacketPicker } from "./racket-picker";
import { StringSetupSection } from "./string-setup-fields";
import { ServicesEditor, lineTotalCents } from "./services-editor";
import { KnotsSelector } from "./knots-selector";
import { racketLabel } from "@/lib/racket-label";
import { formatCents, formatDate } from "@/lib/format";
import type { RacketWithSpecs } from "@/lib/rackets";
import { fetchPreviousSetup } from "@/app/jobs/actions";
import type { PreviousJobSetup } from "@/lib/jobs";
import { applyRepeatToValues, type JobFormState, type JobFormValues } from "@/lib/job-form-types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} fullWidth>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function PreviousSetupCard({ setup, onRepeat }: { setup: PreviousJobSetup; onRepeat: () => void }) {
  const main = setup.strings.find((s) => s.role === "main");
  const cross = setup.strings.find((s) => s.role === "cross");
  const sameString = main && cross && main.brandSnapshot === cross.brandSnapshot && main.stringNameSnapshot === cross.stringNameSnapshot;
  const sameTension = main?.tension === cross?.tension;
  return (
    <Card tone="sunken" padding="16px 18px">
      <div className="lab" style={{ marginBottom: 8 }}>
        Last string job · {formatDate(setup.receivedOn)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {sameString ? (
          <div className="num" style={{ fontSize: 14.5 }}>
            {main.brandSnapshot} {main.stringNameSnapshot}
            {main.gaugeSnapshot ? ` ${main.gaugeSnapshot}` : ""}
          </div>
        ) : (
          <>
            {main ? <div className="num" style={{ fontSize: 14.5 }}>Main: {main.brandSnapshot} {main.stringNameSnapshot}</div> : null}
            {cross ? <div className="num" style={{ fontSize: 14.5 }}>Cross: {cross.brandSnapshot} {cross.stringNameSnapshot}</div> : null}
          </>
        )}
        <div className="row-s num">
          {sameTension ? `${main?.tension} ${main?.tensionUnit}` : `${main?.tension ?? "?"} / ${cross?.tension ?? "?"} ${main?.tensionUnit ?? "lb"}`}
          {setup.numberOfKnots ? ` · ${setup.numberOfKnots} knots` : ""}
          {setup.preStretchType === "none" ? " · No pre-stretch" : ` · Pre-stretch (${setup.preStretchType}${setup.preStretchPct ? ` ${setup.preStretchPct}%` : ""})`}
        </div>
        <div className="row-s num">{formatCents(setup.finalPriceCents)}</div>
      </div>
      <Button type="button" size="sm" onClick={onRepeat} style={{ marginTop: 12 }}>
        Repeat previous setup
      </Button>
    </Card>
  );
}

export function JobForm({
  mode,
  action,
  initialState,
  customers,
  initialCustomer = null,
  initialRacket = null,
  submitLabel,
}: {
  mode: "create" | "edit";
  action: (state: JobFormState, formData: FormData) => Promise<JobFormState>;
  initialState: JobFormState;
  customers: PickerCustomer[];
  initialCustomer?: PickerCustomer | null;
  initialRacket?: RacketWithSpecs | null;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [customer, setCustomer] = useState<PickerCustomer | null>(initialCustomer);
  const [racket, setRacket] = useState<RacketWithSpecs | null>(initialRacket);
  const [values, setValues] = useState<JobFormValues>(state.values);
  const [previousSetup, setPreviousSetup] = useState<PreviousJobSetup | null | undefined>(undefined);
  // Flips on synchronously wherever the racket selection changes (the
  // onSelect handlers below), not here — set-state-in-effect only allows
  // async updates (inside .then()) in the effect body itself.
  const [loadingPrevious, setLoadingPrevious] = useState(!!initialRacket);

  useEffect(() => {
    if (!racket) return;
    let cancelled = false;
    fetchPreviousSetup(racket.id).then((setup) => {
      if (!cancelled) {
        setPreviousSetup(setup);
        setLoadingPrevious(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [racket]);

  const subtotalCents = useMemo(() => values.services.reduce((sum, s) => sum + lineTotalCents(s), 0), [values.services]);
  const discountCents = Math.round((Number.parseFloat(values.discount) || 0) * 100);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  const patch = (p: Partial<JobFormValues>) => setValues((v) => ({ ...v, ...p }));

  return (
    <form action={formAction} className="job-layout">
      <input type="hidden" name="customerId" value={customer?.id ?? ""} />
      <input type="hidden" name="customerRacketId" value={racket?.id ?? ""} />
      <input type="hidden" name="setupType" value={values.setupType} />
      <input type="hidden" name="receivedOn" value={values.receivedOn} />
      <input type="hidden" name="dueOn" value={values.dueOn} />
      <input type="hidden" name="numberOfKnots" value={values.numberOfKnots} />
      <input type="hidden" name="preStretchType" value={values.preStretchType} />
      <input type="hidden" name="preStretchPct" value={values.preStretchPct} />
      <input type="hidden" name="paymentStatus" value={values.paymentStatus} />
      <input type="hidden" name="paymentMethod" value={values.paymentMethod} />
      <input type="hidden" name="discount" value={values.discount} />
      <input type="hidden" name="generalNotes" value={values.generalNotes} />
      <input type="hidden" name="stringingNotes" value={values.stringingNotes} />
      <input type="hidden" name="main.customerSupplied" value={String(values.main.customerSupplied)} />
      <input type="hidden" name="main.brand" value={values.main.brand} />
      <input type="hidden" name="main.stringName" value={values.main.stringName} />
      <input type="hidden" name="main.gauge" value={values.main.gauge} />
      <input type="hidden" name="main.colour" value={values.main.colour} />
      <input type="hidden" name="main.tension" value={values.main.tension} />
      <input type="hidden" name="main.tensionUnit" value={values.main.tensionUnit} />
      <input type="hidden" name="cross.customerSupplied" value={String(values.cross.customerSupplied)} />
      <input type="hidden" name="cross.brand" value={values.cross.brand} />
      <input type="hidden" name="cross.stringName" value={values.cross.stringName} />
      <input type="hidden" name="cross.gauge" value={values.cross.gauge} />
      <input type="hidden" name="cross.colour" value={values.cross.colour} />
      <input type="hidden" name="cross.tension" value={values.cross.tension} />
      <input type="hidden" name="cross.tensionUnit" value={values.cross.tensionUnit} />
      <input type="hidden" name="servicesCount" value={values.services.length} />
      {values.services.map((s, i) => (
        <span key={i}>
          <input type="hidden" name={`services[${i}].serviceName`} value={s.serviceName} />
          <input type="hidden" name={`services[${i}].quantity`} value={s.quantity} />
          <input type="hidden" name={`services[${i}].unitPrice`} value={s.unitPrice} />
          <input type="hidden" name={`services[${i}].notes`} value={s.notes} />
        </span>
      ))}

      <div className="job-layout-main">
        {state.status === "error" ? (
          <div className="form-warning">
            <p>{state.message}</p>
          </div>
        ) : null}

        <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="lab">Customer &amp; racket</div>
          {mode === "edit" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="row-t">{customer?.name}</div>
              <div className="row-s num">
                {customer?.code} · {customer?.phone}
              </div>
              <div className="row-t" style={{ marginTop: 8 }}>
                {racket ? racketLabel({ brand: racket.effectiveBrand, series: racket.effectiveSeries, model: racket.effectiveModel, generationYear: racket.effectiveGenerationYear, generationName: racket.effectiveGenerationName }) : "—"}
              </div>
              <div className="row-s num">
                {racket?.code}
                {racket?.nickname ? ` · ${racket.nickname}` : ""}
              </div>
            </div>
          ) : (
            <>
              <CustomerPicker
                customers={customers}
                selected={customer}
                onSelect={(c) => {
                  setCustomer(c);
                  setRacket(null);
                }}
              />
              {customer ? (
                <RacketPicker
                  customerId={customer.id}
                  selected={racket}
                  onSelect={(r) => {
                    setRacket(r);
                    setLoadingPrevious(!!r);
                  }}
                />
              ) : null}
            </>
          )}
        </Card>

        {racket ? (
          <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="lab">String setup</div>
            <div className="tabs-lite" role="tablist">
              <button type="button" className={"tab-lite" + (values.setupType === "full" ? " on" : "")} onClick={() => patch({ setupType: "full" })}>
                Full bed
              </button>
              <button type="button" className={"tab-lite" + (values.setupType === "hybrid" ? " on" : "")} onClick={() => patch({ setupType: "hybrid" })}>
                Hybrid
              </button>
            </div>
            <StringSetupSection
              setupType={values.setupType}
              main={values.main}
              cross={values.cross}
              onMainChange={(p) => patch({ main: { ...values.main, ...p } })}
              onCrossChange={(p) => patch({ cross: { ...values.cross, ...p } })}
            />
            <KnotsSelector value={values.numberOfKnots} onChange={(v) => patch({ numberOfKnots: v })} />
            <Field label="Pre-stretch">
              <div className="tabs-lite" role="tablist">
                {(["none", "manual", "machine"] as const).map((t) => (
                  <button key={t} type="button" className={"tab-lite" + (values.preStretchType === t ? " on" : "")} onClick={() => patch({ preStretchType: t })}>
                    {t === "none" ? "None" : t === "manual" ? "Manual" : "Machine"}
                  </button>
                ))}
              </div>
            </Field>
            {values.preStretchType === "machine" ? (
              <Field label="Pre-stretch percentage" htmlFor="preStretchPct">
                <Input id="preStretchPct" type="number" inputMode="numeric" step="1" min="0" max="100" value={values.preStretchPct} onChange={(e) => patch({ preStretchPct: e.target.value })} placeholder="10" suffix="%" style={{ width: 140 }} />
              </Field>
            ) : null}
            <Field label="General notes" htmlFor="generalNotes" hint="Customer-facing — e.g. “wants a softer feel”">
              <textarea id="generalNotes" value={values.generalNotes} onChange={(e) => patch({ generalNotes: e.target.value })} />
            </Field>
            <Field label="Internal stringing notes" htmlFor="stringingNotes" hint="Not shown to the customer">
              <textarea id="stringingNotes" value={values.stringingNotes} onChange={(e) => patch({ stringingNotes: e.target.value })} />
            </Field>
          </Card>
        ) : null}
      </div>

      <div className="job-layout-side">
        {racket && !loadingPrevious ? (
          previousSetup ? (
            <PreviousSetupCard
              setup={previousSetup}
              onRepeat={() => {
                setValues((v) => applyRepeatToValues(v, previousSetup));
              }}
            />
          ) : (
            <div className="row-s" style={{ padding: "4px 2px" }}>
              No previous string job on file for this racket.
            </div>
          )
        ) : null}

        {racket ? (
          <>
            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="lab">Services</div>
              <ServicesEditor services={values.services} onChange={(services) => patch({ services })} />
            </Card>

            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="lab">Pricing</div>
              <div className="row-s num" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span>
                <span>{formatCents(subtotalCents)}</span>
              </div>
              <Field label="Discount" htmlFor="discount">
                <Input id="discount" type="number" inputMode="decimal" min="0" step="0.01" value={values.discount} onChange={(e) => patch({ discount: e.target.value })} placeholder="0.00" style={{ width: "100%" }} />
              </Field>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--ink-100)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>
                <span>Total</span>
                <span className="num">{formatCents(totalCents)}</span>
              </div>
            </Card>

            <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="lab">Job details</div>
              <div className="form-grid">
                <Field label="Date received" htmlFor="receivedOn">
                  <Input id="receivedOn" type="date" value={values.receivedOn} onChange={(e) => patch({ receivedOn: e.target.value })} style={{ width: "100%" }} />
                </Field>
                <Field label="Due date" htmlFor="dueOn">
                  <Input id="dueOn" type="date" value={values.dueOn} onChange={(e) => patch({ dueOn: e.target.value })} style={{ width: "100%" }} />
                </Field>
              </div>
              <Field label="Payment status">
                <div className="tabs-lite" role="tablist">
                  {(["unpaid", "partially_paid", "paid"] as const).map((s) => (
                    <button key={s} type="button" className={"tab-lite" + (values.paymentStatus === s ? " on" : "")} onClick={() => patch({ paymentStatus: s })}>
                      {s === "unpaid" ? "Unpaid" : s === "partially_paid" ? "Partial" : "Paid"}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Payment method" htmlFor="paymentMethod">
                <select
                  id="paymentMethod"
                  value={values.paymentMethod}
                  onChange={(e) => patch({ paymentMethod: e.target.value })}
                  style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
                >
                  <option value="">—</option>
                  <option value="paynow">PayNow</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank transfer</option>
                  <option value="card">Card</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </Card>

            <div className="job-save-sticky">
              <SubmitButton label={submitLabel} />
            </div>
          </>
        ) : null}
      </div>
    </form>
  );
}
