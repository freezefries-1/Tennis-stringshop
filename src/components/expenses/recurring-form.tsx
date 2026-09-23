"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { createRecurringExpenseAction, updateRecurringExpenseAction } from "@/app/expenses/recurring/actions";
import { EXPENSE_PAYMENT_METHODS, RECURRING_FREQUENCY_LABEL } from "./expense-status";
import type { ExpenseCategory } from "@/lib/expenses";
import type { RecurringExpense, RecurringExpenseInput, RecurringFrequency } from "@/lib/recurring-expenses";

const TODAY = new Date().toISOString().slice(0, 10);

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 15, width: "100%" };
}

export function RecurringForm({ mode, recurring, categories }: { mode: "create" | "edit"; recurring?: RecurringExpense; categories: ExpenseCategory[] }) {
  const router = useRouter();
  const [description, setDescription] = useState(recurring?.description ?? "");
  const [categoryId, setCategoryId] = useState(recurring?.categoryId ?? categories[0]?.id ?? "");
  const [vendor, setVendor] = useState(recurring?.vendor ?? "");
  const [amount, setAmount] = useState(recurring?.amountCents != null ? (recurring.amountCents / 100).toFixed(2) : "");
  const [frequency, setFrequency] = useState<RecurringFrequency>(recurring?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(recurring?.startDate ?? TODAY);
  const [endDate, setEndDate] = useState(recurring?.endDate ?? "");
  const [paymentMethod, setPaymentMethod] = useState(recurring?.paymentMethod ?? "PayNow");
  const [notes, setNotes] = useState(recurring?.notes ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!description.trim() || !categoryId || !amount.trim() || !startDate) {
      setError("Description, category, amount and start date are required.");
      return;
    }
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: RecurringExpenseInput = {
      description,
      categoryId,
      vendor: vendor || null,
      amountCents,
      frequency,
      startDate,
      endDate: endDate || null,
      paymentMethod: paymentMethod || null,
      notes: notes || null,
    };
    const row = mode === "create" ? await createRecurringExpenseAction(input) : await updateRecurringExpenseAction(recurring!.id, input);
    setSaving(false);
    if (row) router.push("/expenses/recurring");
  }

  return (
    <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      {mode === "edit" ? (
        <div className="row-s" style={{ background: "var(--paper-100)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
          Changing the amount here only affects expenses generated from now on — past expenses already recorded from this template keep their original amount.
        </div>
      ) : null}

      {error ? (
        <div className="form-warning">
          <p>{error}</p>
        </div>
      ) : null}

      <Field label="Description" required>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Studio rent" style={{ width: "100%" }} />
      </Field>

      <div className="form-grid">
        <Field label="Category" required>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={selectStyle()}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount" required htmlFor="amount">
          <Input id="amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
      </div>

      <Field label="Vendor / Payee" hint="Optional">
        <Input value={vendor} onChange={(e) => setVendor(e.target.value)} style={{ width: "100%" }} />
      </Field>

      <div className="form-grid">
        <Field label="Frequency" required>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} style={selectStyle()}>
            {(Object.keys(RECURRING_FREQUENCY_LABEL) as RecurringFrequency[]).map((f) => (
              <option key={f} value={f}>
                {RECURRING_FREQUENCY_LABEL[f]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment method" hint="Optional">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={selectStyle()}>
            <option value="">—</option>
            {EXPENSE_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="form-grid">
        <Field label="Start date" required htmlFor="startDate">
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%" }} disabled={mode === "edit"} />
        </Field>
        <Field label="End date" hint="Optional — leave blank for ongoing" htmlFor="endDate">
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "100%" }} />
        </Field>
      </div>
      {mode === "edit" ? <div className="row-s">Start date can&rsquo;t be changed once created — it anchors when the next due date already advanced from.</div> : null}

      <Field label="Notes" hint="Optional">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Button type="button" disabled={saving} onClick={save}>
        {saving ? "Saving…" : mode === "create" ? "Save recurring expense" : "Save changes"}
      </Button>
    </Card>
  );
}
