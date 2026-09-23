"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { createOtherIncomeAction, updateOtherIncomeAction } from "@/app/other-income/actions";
import { OTHER_INCOME_PAYMENT_METHODS, SUGGESTED_OTHER_INCOME_CATEGORIES } from "./other-income-status";
import type { OtherIncome, OtherIncomeInput } from "@/lib/other-income";

const TODAY = new Date().toISOString().slice(0, 10);

export function OtherIncomeForm({ mode, income, categories }: { mode: "create" | "edit"; income?: OtherIncome; categories: string[] }) {
  const router = useRouter();
  const [incomeDate, setIncomeDate] = useState(income?.incomeDate ?? TODAY);
  const [description, setDescription] = useState(income?.description ?? "");
  const [category, setCategory] = useState(income?.category ?? SUGGESTED_OTHER_INCOME_CATEGORIES[0]);
  const [amount, setAmount] = useState(income?.amountCents != null ? (income.amountCents / 100).toFixed(2) : "");
  const [paymentMethod, setPaymentMethod] = useState(income?.paymentMethod ?? "PayNow");
  const [source, setSource] = useState(income?.source ?? "");
  const [referenceNumber, setReferenceNumber] = useState(income?.referenceNumber ?? "");
  const [notes, setNotes] = useState(income?.notes ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryOptions = Array.from(new Set([...SUGGESTED_OTHER_INCOME_CATEGORIES, ...categories]));

  async function save() {
    if (!incomeDate || !description.trim() || !category.trim() || !amount.trim()) {
      setError("Date, description, category and amount are required.");
      return;
    }
    const amountCents = Math.round(Number.parseFloat(amount) * 100);
    if (Number.isNaN(amountCents) || amountCents <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    setSaving(true);
    setError(null);

    const input: OtherIncomeInput = {
      incomeDate,
      description,
      category,
      source: source || null,
      amountCents,
      paymentMethod: paymentMethod || null,
      referenceNumber: referenceNumber || null,
      notes: notes || null,
    };
    const result = mode === "create" ? await createOtherIncomeAction(input) : await updateOtherIncomeAction(income!.id, input);
    setSaving(false);
    if (result.status === "voided") {
      setError("This income record has been voided and can no longer be edited — record a new one instead.");
      return;
    }
    if (result.incomeId) router.push(`/other-income/${result.incomeId}`);
  }

  return (
    <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      <div className="row-s" style={{ background: "var(--paper-100)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
        For money in that isn&rsquo;t Sales revenue — selling old equipment, a refund, or similar. A customer transaction (stringing or retail) still goes through POS/Sales, not here.
      </div>

      {error ? (
        <div className="form-warning">
          <p>{error}</p>
        </div>
      ) : null}

      <div className="form-grid">
        <Field label="Date" required htmlFor="incomeDate">
          <Input id="incomeDate" type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="Amount" required htmlFor="amount">
          <Input id="amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
      </div>

      <Field label="Description" required>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Sold old Yonex stringing machine" style={{ width: "100%" }} />
      </Field>

      <div className="form-grid">
        <Field label="Category" required htmlFor="category">
          <Input id="category" list="income-category-suggestions" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }} />
          <datalist id="income-category-suggestions">
            {categoryOptions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Payment method" hint="Optional">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 15, width: "100%" }}
          >
            <option value="">—</option>
            {OTHER_INCOME_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Source" hint="Optional — who paid / bought it" htmlFor="source">
        <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Carousell buyer, John" style={{ width: "100%" }} />
      </Field>

      <Field label="Reference number" hint="Optional" htmlFor="reference">
        <Input id="reference" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} style={{ width: "100%" }} />
      </Field>

      <Field label="Notes" htmlFor="notes" hint="Optional">
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Button type="button" disabled={saving} onClick={save}>
        {saving ? "Saving…" : mode === "create" ? "Save income" : "Save changes"}
      </Button>
    </Card>
  );
}
