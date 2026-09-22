"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import type { CustomerFormState } from "@/lib/customer-form-types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function CustomerForm({
  action,
  initialState,
  submitLabel,
}: {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  initialState: CustomerFormState;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="form">
      {state.status === "duplicate" && state.duplicate ? (
        <div className="form-warning">
          <p>
            A customer with this phone number already exists: <strong>{state.duplicate.name}</strong> ({state.duplicate.code}).
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/customers/${state.duplicate.id}`}>
              <Button type="button" size="sm" variant="secondary">
                View existing customer
              </Button>
            </Link>
            <Button type="submit" name="force" value="true" size="sm">
              Create anyway
            </Button>
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="form-warning">
          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="form-grid">
        <Field label="Name" required htmlFor="name">
          <Input id="name" name="name" defaultValue={state.values.name} required style={{ width: "100%" }} />
        </Field>
        <Field label="Phone" required htmlFor="phone">
          <Input id="phone" name="phone" type="tel" defaultValue={state.values.phone} required style={{ width: "100%" }} />
        </Field>
      </div>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={state.values.email} style={{ width: "100%" }} />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <textarea id="notes" name="notes" defaultValue={state.values.notes} />
      </Field>

      <div className="form-actions">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
