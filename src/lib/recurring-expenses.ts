import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { expenseCategories, recurringExpenses } from "@/db/schema";
import { createExpense, type Expense } from "./expenses";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RecurringExpense = typeof recurringExpenses.$inferSelect;
export type RecurringFrequency = RecurringExpense["frequency"];

export interface RecurringExpenseInput {
  description: string;
  categoryId: string;
  vendor?: string | null;
  amountCents: number;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
}

function cleanInput(input: RecurringExpenseInput) {
  return {
    description: input.description.trim(),
    categoryId: input.categoryId,
    vendor: input.vendor?.trim() || null,
    amountCents: input.amountCents,
    frequency: input.frequency,
    startDate: input.startDate,
    endDate: input.endDate || null,
    paymentMethod: input.paymentMethod?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

/** Template only — this row is never itself an Expense (brief §15). Its
 * nextDueDate starts at startDate; the first "Generate due expense" call
 * produces the first real occurrence and advances it from there. */
export async function createRecurringExpense(input: RecurringExpenseInput): Promise<RecurringExpense> {
  const values = cleanInput(input);
  const [row] = await db.insert(recurringExpenses).values({ ...values, nextDueDate: values.startDate }).returning();
  return row;
}

/** Changing description/category/vendor/amount/frequency/paymentMethod
 * here only ever affects occurrences generated AFTER this save (brief
 * §17) — every `expenses` row already generated snapshots its own
 * amountCents/categoryId/etc at generation time and is never rewritten.
 * nextDueDate is deliberately not editable through this form — it only
 * ever moves forward via generateDueExpense, so a template can't be made
 * to re-generate a period it already covered by hand-editing the date. */
export async function updateRecurringExpense(id: string, input: RecurringExpenseInput): Promise<RecurringExpense | null> {
  const values = cleanInput(input);
  const [row] = await db
    .update(recurringExpenses)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(recurringExpenses.id, id))
    .returning();
  return row ?? null;
}

export async function setRecurringExpenseActive(id: string, active: boolean): Promise<void> {
  await db.update(recurringExpenses).set({ active, updatedAt: new Date() }).where(eq(recurringExpenses.id, id));
}

export interface RecurringExpenseRow extends RecurringExpense {
  categoryName: string;
  isDue: boolean;
}

export async function listRecurringExpenses(includeInactive = false): Promise<RecurringExpenseRow[]> {
  const rows = await db
    .select({ recurring: recurringExpenses, categoryName: expenseCategories.name })
    .from(recurringExpenses)
    .innerJoin(expenseCategories, eq(expenseCategories.id, recurringExpenses.categoryId))
    .where(includeInactive ? sql`true` : eq(recurringExpenses.active, true))
    .orderBy(asc(recurringExpenses.nextDueDate));
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((r) => ({ ...r.recurring, categoryName: r.categoryName, isDue: r.recurring.active && r.recurring.nextDueDate <= today && (!r.recurring.endDate || r.recurring.nextDueDate <= r.recurring.endDate) }));
}

export async function getRecurringExpense(id: string): Promise<RecurringExpenseRow | null> {
  const [row] = await db
    .select({ recurring: recurringExpenses, categoryName: expenseCategories.name })
    .from(recurringExpenses)
    .innerJoin(expenseCategories, eq(expenseCategories.id, recurringExpenses.categoryId))
    .where(eq(recurringExpenses.id, id))
    .limit(1);
  if (!row) return null;
  const today = new Date().toISOString().slice(0, 10);
  return { ...row.recurring, categoryName: row.categoryName, isDue: row.recurring.active && row.recurring.nextDueDate <= today && (!row.recurring.endDate || row.recurring.nextDueDate <= row.recurring.endDate) };
}

/** Plain calendar-date arithmetic (yyyy-mm-dd in, yyyy-mm-dd out) — no
 * timezone involved, a due date is a calendar day, not an instant. */
export function computeNextDueDate(current: string, frequency: RecurringFrequency): string {
  const [y, m, d] = current.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  switch (frequency) {
    case "weekly":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case "quarterly":
      date.setUTCMonth(date.getUTCMonth() + 3);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }
  return date.toISOString().slice(0, 10);
}

export interface GenerateDueExpenseResult {
  ok: boolean;
  reason?: "not_due" | "not_found" | "inactive" | "ended";
  expense?: Expense;
}

/** Idempotent by construction, not by a separate "already generated?"
 * check (brief §16 — never generate the same period twice). Locks the
 * template row for the duration of the transaction: creates the Expense
 * for whatever nextDueDate currently is, then immediately advances
 * nextDueDate past it in the SAME transaction. A concurrent second call
 * (double-click, retry) blocks on the row lock until the first commits,
 * then re-reads nextDueDate — already moved forward — and correctly
 * reports "not_due" instead of creating a second Expense for the same
 * period. This is the same lock-then-check-then-act shape as the job/sale
 * idempotency guards elsewhere in this app. */
export async function generateDueExpense(recurringExpenseId: string): Promise<GenerateDueExpenseResult> {
  return db.transaction(async (tx: Tx) => {
    const [template] = await tx.select().from(recurringExpenses).where(eq(recurringExpenses.id, recurringExpenseId)).for("update");
    if (!template) return { ok: false, reason: "not_found" };
    if (!template.active) return { ok: false, reason: "inactive" };
    const today = new Date().toISOString().slice(0, 10);
    if (template.nextDueDate > today) return { ok: false, reason: "not_due" };
    if (template.endDate && template.nextDueDate > template.endDate) return { ok: false, reason: "ended" };

    const expense = await createExpense(
      {
        expenseDate: template.nextDueDate,
        description: template.description,
        categoryId: template.categoryId,
        vendor: template.vendor,
        amountCents: template.amountCents,
        paymentMethod: template.paymentMethod,
        referenceNumber: null,
        notes: template.notes,
        treatment: "operating",
      },
      template.id,
      tx,
    );

    const nextDue = computeNextDueDate(template.nextDueDate, template.frequency);
    await tx.update(recurringExpenses).set({ nextDueDate: nextDue, updatedAt: new Date() }).where(eq(recurringExpenses.id, template.id));

    return { ok: true, expense };
  });
}

/** Powers "Expenses Due" / "Generate Due Expenses" (brief §16 — a manual
 * but safe workflow, no pretend background scheduler). Catches each due
 * template up to the current period — a template that's fallen behind
 * (e.g. paused for months) generates one Expense per missed period, not
 * just the latest one, so history isn't silently skipped — bounded to 60
 * iterations per template (5 years of monthly, worst case) so a data
 * mistake can't spin this into an unbounded loop. */
export async function generateAllDueExpenses(): Promise<{ generated: number; templateIds: string[] }> {
  const today = new Date().toISOString().slice(0, 10);
  const due = await db
    .select({ id: recurringExpenses.id })
    .from(recurringExpenses)
    .where(and(eq(recurringExpenses.active, true), lte(recurringExpenses.nextDueDate, today), sql`(${recurringExpenses.endDate} is null or ${recurringExpenses.nextDueDate} <= ${recurringExpenses.endDate})`));

  let generated = 0;
  const templateIds: string[] = [];
  for (const row of due) {
    let madeOne = false;
    for (let i = 0; i < 60; i++) {
      const result = await generateDueExpense(row.id);
      if (!result.ok) break;
      generated++;
      madeOne = true;
    }
    if (madeOne) templateIds.push(row.id);
  }
  return { generated, templateIds };
}
