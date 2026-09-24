"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { unlockAction } from "./actions";
import { initialUnlockState } from "./unlock-form-types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} fullWidth>
      {pending ? "Checking…" : "Unlock"}
    </Button>
  );
}

export function UnlockForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(unlockAction, initialUnlockState);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--paper-050)" }}>
      <Card padding="32px" style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div className="lab">SportCraft</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, marginTop: 4 }}>Enter PIN</h1>
        </div>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="hidden" name="next" value={next} />
          <Field label="PIN" htmlFor="pin" error={state.status === "error" ? state.message : undefined}>
            <Input id="pin" name="pin" type="password" inputMode="numeric" autoFocus autoComplete="off" style={{ width: "100%" }} />
          </Field>
          <SubmitButton />
        </form>
      </Card>
    </div>
  );
}
