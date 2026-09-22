"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import type { RacketFormState } from "@/lib/racket-form-types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function RacketForm({
  action,
  initialState,
  submitLabel,
}: {
  action: (state: RacketFormState, formData: FormData) => Promise<RacketFormState>;
  initialState: RacketFormState;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const v = state.values;

  return (
    <form action={formAction} className="form" style={{ maxWidth: 720 }}>
      {state.status === "error" ? (
        <div className="form-warning">
          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="form-grid">
        <Field label="Brand" htmlFor="brand">
          <Input id="brand" name="brand" defaultValue={v.brand} placeholder="Yonex" style={{ width: "100%" }} />
        </Field>
        <Field label="Series" htmlFor="series">
          <Input id="series" name="series" defaultValue={v.series} placeholder="EZONE" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Model" htmlFor="model">
          <Input id="model" name="model" defaultValue={v.model} placeholder="100" style={{ width: "100%" }} />
        </Field>
        <Field label="Generation / year" htmlFor="generationYear">
          <Input id="generationYear" name="generationYear" type="number" defaultValue={v.generationYear} placeholder="2025" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Head size (sq in)" htmlFor="headSizeSqin">
          <Input id="headSizeSqin" name="headSizeSqin" defaultValue={v.headSizeSqin} placeholder="100" style={{ width: "100%" }} />
        </Field>
        <Field label="String pattern" htmlFor="stringPattern">
          <Input id="stringPattern" name="stringPattern" defaultValue={v.stringPattern} placeholder="16 × 19" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Grip size" htmlFor="gripSize">
          <Input id="gripSize" name="gripSize" defaultValue={v.gripSize} placeholder="G4" style={{ width: "100%" }} />
        </Field>
        <Field label="Static weight (g)" htmlFor="staticWeightG">
          <Input id="staticWeightG" name="staticWeightG" type="number" defaultValue={v.staticWeightG} placeholder="300" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Swingweight" htmlFor="swingweight">
          <Input id="swingweight" name="swingweight" type="number" defaultValue={v.swingweight} placeholder="320" style={{ width: "100%" }} />
        </Field>
        <Field label="Balance (mm)" htmlFor="balanceMm">
          <Input id="balanceMm" name="balanceMm" type="number" defaultValue={v.balanceMm} placeholder="320" style={{ width: "100%" }} />
        </Field>
      </div>
      <Field label="Customisation notes" htmlFor="customisationNotes" hint="Lead tape, grip build-up, anything done to this specific frame.">
        <textarea id="customisationNotes" name="customisationNotes" defaultValue={v.customisationNotes} />
      </Field>
      <Field label="General notes" htmlFor="notes">
        <textarea id="notes" name="notes" defaultValue={v.notes} />
      </Field>

      <div className="form-actions">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
