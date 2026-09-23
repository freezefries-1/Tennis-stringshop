"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { createExpenseAction, updateExpenseAction, checkExpenseDuplicateAction } from "@/app/expenses/actions";
import { EXPENSE_PAYMENT_METHODS } from "./expense-status";
import type { Expense, ExpenseCategory, ExpenseInput } from "@/lib/expenses";

const TODAY = new Date().toISOString().slice(0, 10);

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 15, width: "100%" };
}

export function ExpenseForm({ mode, expense, categories, vendors }: { mode: "create" | "edit"; expense?: Expense; categories: ExpenseCategory[]; vendors: string[] }) {
  const router = useRouter();
  const [expenseDate, setExpenseDate] = useState(expense?.expenseDate ?? TODAY);
  const [description, setDescription] = useState(expense?.description ?? "");
  const [categoryId, setCategoryId] = useState(expense?.categoryId ?? categories[0]?.id ?? "");
  const [amount, setAmount] = useState(expense?.amountCents != null ? (expense.amountCents / 100).toFixed(2) : "");
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod ?? "PayNow");
  const [vendor, setVendor] = useState(expense?.vendor ?? "");
  const [referenceNumber, setReferenceNumber] = useState(expense?.referenceNumber ?? "");
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [treatment, setTreatment] = useState<ExpenseInput["treatment"]>(expense?.treatment ?? "operating");

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(allowDuplicate: boolean) {
    if (!expenseDate || !description.trim() || !categoryId || !amount.trim()) {
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

    if (!allowDuplicate) {
      const dup = await checkExpenseDuplicateAction(expenseDate, vendor || null, amountCents, description, expense?.id);
      if (dup) {
        setDuplicateWarning(`A similar expense already exists: ${dup.expenseNumber} — same date, vendor, amount and description.`);
        setSaving(false);
        return;
      }
    }

    const input: ExpenseInput = {
      expenseDate,
      description,
      categoryId,
      vendor: vendor || null,
      amountCents,
      paymentMethod: paymentMethod || null,
      referenceNumber: referenceNumber || null,
      receiptUrl: receiptUrl || null,
      notes: notes || null,
      treatment,
    };
    const result = mode === "create" ? await createExpenseAction(input) : await updateExpenseAction(expense!.id, input);
    setSaving(false);
    if (result.status === "voided") {
      setError("This expense has been voided and can no longer be edited — record a new one instead.");
      return;
    }
    if (result.expenseId) router.push(`/expenses/${result.expenseId}`);
  }

  return (
    <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      <div className="row-s" style={{ background: "var(--paper-100)", padding: "10px 12px", borderRadius: "var(--radius-sm)" }}>
        Don&rsquo;t record inventory purchases (string reels, retail stock) here — use Receive stock instead. Their cost becomes COGS automatically when sold. This form is for operating costs like delivery, software, rent, and similar.
      </div>

      {error ? (
        <div className="form-warning">
          <p>{error}</p>
        </div>
      ) : null}
      {duplicateWarning ? (
        <div className="form-warning">
          <p>{duplicateWarning}</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => save(true)} disabled={saving}>
            Save anyway
          </Button>
        </div>
      ) : null}

      <div className="form-grid">
        <Field label="Date" required htmlFor="expenseDate">
          <Input id="expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="Amount" required htmlFor="amount">
          <Input id="amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
        </Field>
      </div>

      <Field label="Description" required>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Grab delivery to customer" style={{ width: "100%" }} />
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

      <Field label="Vendor / Payee" hint="Optional" htmlFor="vendor">
        <Input id="vendor" list="vendor-suggestions" value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Grab, Vercel, Supabase" style={{ width: "100%" }} />
        <datalist id="vendor-suggestions">
          {vendors.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </Field>

      <div className="form-grid">
        <Field label="Reference number" hint="Optional — invoice/receipt no." htmlFor="reference">
          <Input id="reference" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} style={{ width: "100%" }} />
        </Field>
        <Field label="Treatment">
          <div className="tabs-lite" role="tablist">
            <button type="button" className={"tab-lite" + (treatment === "operating" ? " on" : "")} onClick={() => setTreatment("operating")}>
              Operating expense
            </button>
            <button type="button" className={"tab-lite" + (treatment === "capital" ? " on" : "")} onClick={() => setTreatment("capital")}>
              Capital / equipment
            </button>
          </div>
        </Field>
      </div>
      {treatment === "capital" ? <div className="row-s">Capital/equipment purchases are recorded and shown separately but not subtracted from Net Profit this phase (no depreciation schedule yet).</div> : null}

      <Field label="Receipt link" hint="Optional — a URL to a photo you've already saved (Google Photos, Drive, etc.). Direct upload isn't available yet." htmlFor="receiptUrl">
        <Input id="receiptUrl" type="url" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} placeholder="https://..." style={{ width: "100%" }} />
      </Field>

      <Field label="Notes" htmlFor="notes" hint="Optional">
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <Button type="button" disabled={saving} onClick={() => save(false)}>
        {saving ? "Saving…" : mode === "create" ? "Save expense" : "Save changes"}
      </Button>
    </Card>
  );
}
