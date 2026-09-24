"use client";

import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from "react";
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
import { fetchPreviousSetup, fetchSuggestedStringUsage } from "@/app/jobs/actions";
import type { PreviousJobSetup } from "@/lib/jobs";
import type { MachineOption } from "@/lib/machines";
import type { SuggestedStringUsage } from "@/lib/string-usage";
import { applyRepeatToValues, type JobFormState, type JobFormValues, type StringUsageDefaultsView } from "@/lib/job-form-types";

/** Fills in a still-blank usage field with the suggested length (brief:
 * racket model → string pattern → global default priority, resolved by
 * fetchSuggestedStringUsage) — never overwrites something the user already
 * typed, repeated from a previous job, or that came back from a rejected
 * submit. Falls back to the flat global default only while the per-racket
 * suggestion hasn't loaded yet (or has nothing to say, e.g. no racket). */
function withSuggestedUsage(values: JobFormValues, suggestion: SuggestedStringUsage | null, fallback: StringUsageDefaultsView): JobFormValues {
  const fullBedM = suggestion?.fullBedM ?? fallback.fullBedUsageM;
  const mainM = suggestion?.mainM ?? fallback.mainUsageM;
  const crossM = suggestion?.crossM ?? fallback.crossUsageM;
  if (values.setupType === "full") {
    if (values.main.customerSupplied || values.main.quantityUsed) return values;
    return { ...values, main: { ...values.main, quantityUsed: String(fullBedM) } };
  }
  const main = !values.main.customerSupplied && !values.main.quantityUsed ? { ...values.main, quantityUsed: String(mainM) } : values.main;
  const cross = !values.cross.customerSupplied && !values.cross.quantityUsed ? { ...values.cross, quantityUsed: String(crossM) } : values.cross;
  return { ...values, main, cross };
}

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
  jobId,
  action,
  initialState,
  customers,
  initialCustomer = null,
  initialRacket = null,
  stringUsageDefaults,
  machineOptions,
  submitLabel,
}: {
  mode: "create" | "edit";
  /** The job currently being edited — excluded from the "previous setup"
   * lookup below, otherwise editing a job whose racket has no OTHER jobs
   * yet fetches the job's own current values as its "previous setup",
   * making "Repeat previous setup" a silent no-op (it just re-copies the
   * job onto itself, so nothing visibly changes). Omitted in create mode,
   * where there's no current job to exclude. */
  jobId?: string;
  action: (state: JobFormState, formData: FormData) => Promise<JobFormState>;
  initialState: JobFormState;
  customers: PickerCustomer[];
  initialCustomer?: PickerCustomer | null;
  initialRacket?: RacketWithSpecs | null;
  stringUsageDefaults: StringUsageDefaultsView;
  machineOptions: MachineOption[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [customer, setCustomer] = useState<PickerCustomer | null>(initialCustomer);
  const [racket, setRacket] = useState<RacketWithSpecs | null>(initialRacket);
  const [values, setValues] = useState<JobFormValues>(state.values);
  const [previousSetup, setPreviousSetup] = useState<PreviousJobSetup | null | undefined>(undefined);
  // The real per-racket suggestion (model → pattern → global), fetched
  // below — null until it resolves (or if there's no racket yet), in which
  // case withSuggestedUsage falls back to the flat global default so the
  // form is never left completely blank while waiting.
  const [suggestedUsage, setSuggestedUsage] = useState<SuggestedStringUsage | null>(null);
  // Flips on synchronously wherever the racket selection changes (the
  // onSelect handlers below), not here — set-state-in-effect only allows
  // async updates (inside .then()) in the effect body itself.
  const [loadingPrevious, setLoadingPrevious] = useState(!!initialRacket);
  // Confirmed via the insufficient-stock warning's "Save anyway" button —
  // see the effect below for why this can't just be a submit-button click.
  const [stockOverride, setStockOverride] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pendingOverrideSubmit = useRef(false);

  useEffect(() => {
    if (!racket) return;
    let cancelled = false;
    Promise.all([fetchPreviousSetup(racket.id, jobId), fetchSuggestedStringUsage(racket.id)]).then(([setup, suggestion]) => {
      if (!cancelled) {
        setPreviousSetup(setup);
        setSuggestedUsage(suggestion);
        setLoadingPrevious(false);
        // A found previous setup is only applied if/when the user clicks
        // "Repeat previous setup" below — either way, a still-blank usage
        // field gets the suggested length (this racket's own recommended
        // length, else its string pattern's default, else the global
        // default) as a starting point now.
        setValues((v) => withSuggestedUsage(v, suggestion, stringUsageDefaults));
      }
    });
    return () => {
      cancelled = true;
    };
    // stringUsageDefaults is a stable prop (fetched once server-side) —
    // only racket/jobId identity should re-trigger the lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [racket, jobId]);

  // Re-submits the form once `stockOverride` has actually re-rendered into
  // the hidden input below — a submit button's onClick fires before React
  // commits a state update, so clicking "Save anyway" straight away would
  // still send the stale (unconfirmed) value.
  useEffect(() => {
    if (pendingOverrideSubmit.current && stockOverride) {
      pendingOverrideSubmit.current = false;
      formRef.current?.requestSubmit();
    }
  }, [stockOverride]);

  const subtotalCents = useMemo(() => values.services.reduce((sum, s) => sum + lineTotalCents(s), 0), [values.services]);
  const discountCents = Math.round((Number.parseFloat(values.discount) || 0) * 100);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  const patch = (p: Partial<JobFormValues>) => setValues((v) => ({ ...v, ...p }));
  const patchSetupType = (setupType: "full" | "hybrid") =>
    setValues((v) => {
      if (v.setupType === setupType) return v;
      // Full bed and hybrid main are different lengths (one string for the
      // whole racket vs. just the mains) — if main's quantity still holds
      // the OTHER mode's own suggestion untouched, clear it first so
      // withSuggestedUsage re-suggests the right amount for the new mode
      // instead of carrying over a stale one. A value the user actually
      // edited (no longer matching either mode's suggestion) is left alone.
      const previousSuggestedM = v.setupType === "full" ? (suggestedUsage?.fullBedM ?? stringUsageDefaults.fullBedUsageM) : (suggestedUsage?.mainM ?? stringUsageDefaults.mainUsageM);
      const main = v.main.quantityUsed !== "" && Number(v.main.quantityUsed) === previousSuggestedM ? { ...v.main, quantityUsed: "" } : v.main;
      return withSuggestedUsage({ ...v, setupType, main }, suggestedUsage, stringUsageDefaults);
    });

  return (
    <form ref={formRef} action={formAction} className="job-layout">
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
      <input type="hidden" name="machineId" value={values.machineId} />
      <input type="hidden" name="allowStockOverride" value={String(stockOverride)} />
      <input type="hidden" name="main.customerSupplied" value={String(values.main.customerSupplied)} />
      <input type="hidden" name="main.stringProductId" value={values.main.stringProductId} />
      <input type="hidden" name="main.brand" value={values.main.brand} />
      <input type="hidden" name="main.stringName" value={values.main.stringName} />
      <input type="hidden" name="main.gauge" value={values.main.gauge} />
      <input type="hidden" name="main.colour" value={values.main.colour} />
      <input type="hidden" name="main.tension" value={values.main.tension} />
      <input type="hidden" name="main.tensionUnit" value={values.main.tensionUnit} />
      <input type="hidden" name="main.quantityUsed" value={values.main.quantityUsed} />
      <input type="hidden" name="main.usageUnit" value={values.main.usageUnit} />
      <input type="hidden" name="cross.customerSupplied" value={String(values.cross.customerSupplied)} />
      <input type="hidden" name="cross.stringProductId" value={values.cross.stringProductId} />
      <input type="hidden" name="cross.brand" value={values.cross.brand} />
      <input type="hidden" name="cross.stringName" value={values.cross.stringName} />
      <input type="hidden" name="cross.gauge" value={values.cross.gauge} />
      <input type="hidden" name="cross.colour" value={values.cross.colour} />
      <input type="hidden" name="cross.tension" value={values.cross.tension} />
      <input type="hidden" name="cross.tensionUnit" value={values.cross.tensionUnit} />
      <input type="hidden" name="cross.quantityUsed" value={values.cross.quantityUsed} />
      <input type="hidden" name="cross.usageUnit" value={values.cross.usageUnit} />
      <input type="hidden" name="servicesCount" value={values.services.length} />
      {values.services.map((s, i) => (
        // Fragment, not a <span> — the form itself is a CSS grid
        // (.job-layout, two columns), so a real element here becomes a
        // grid item and throws off auto-placement of .job-layout-main /
        // .job-layout-side the moment the service count's parity changes
        // (an odd vs even number of these wrappers shifts which column
        // each lands in). A Fragment renders no DOM node, so it can never
        // participate in the grid regardless of how many services there are.
        <Fragment key={i}>
          <input type="hidden" name={`services[${i}].serviceName`} value={s.serviceName} />
          <input type="hidden" name={`services[${i}].quantity`} value={s.quantity} />
          <input type="hidden" name={`services[${i}].unitPrice`} value={s.unitPrice} />
          <input type="hidden" name={`services[${i}].notes`} value={s.notes} />
        </Fragment>
      ))}

      <div className="job-layout-main">
        {state.status === "error" ? (
          <div className="form-warning">
            <p>{state.message}</p>
          </div>
        ) : null}
        {state.status === "insufficient_stock" ? (
          <div className="form-warning">
            <p>{state.message}</p>
            <ul style={{ margin: "8px 0", paddingLeft: 18 }}>
              {(state.shortages ?? []).map((s, i) => (
                <li key={i} style={{ fontSize: 13.5 }}>
                  {s.productLabel} ({s.role}): needed {s.neededM}
                  {s.unit === "set" ? " sets" : "m"}, only {s.availableM}
                  {s.unit === "set" ? " sets" : "m"} available
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                pendingOverrideSubmit.current = true;
                setStockOverride(true);
              }}
            >
              Save anyway (uses more stock than recorded)
            </Button>
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
              <button type="button" className={"tab-lite" + (values.setupType === "full" ? " on" : "")} onClick={() => patchSetupType("full")}>
                Full bed
              </button>
              <button type="button" className={"tab-lite" + (values.setupType === "hybrid" ? " on" : "")} onClick={() => patchSetupType("hybrid")}>
                Hybrid
              </button>
            </div>
            <StringSetupSection
              setupType={values.setupType}
              main={values.main}
              cross={values.cross}
              onMainChange={(p) => patch({ main: { ...values.main, ...p } })}
              onCrossChange={(p) => patch({ cross: { ...values.cross, ...p } })}
              suggestedUsage={suggestedUsage}
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
              <Field label="Machine used" htmlFor="machineId" hint="Optional — can also be set later from the job's own page.">
                <select
                  id="machineId"
                  value={values.machineId}
                  onChange={(e) => patch({ machineId: e.target.value })}
                  style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
                >
                  <option value="">Not recorded</option>
                  {machineOptions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
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
