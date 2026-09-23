import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { otherIncome, otherIncomeAuditLog } from "@/db/schema";

// A DB transaction handle or the top-level db itself — same DbOrTx pattern
// as expenses.ts, kept here in case a future caller (e.g. a "sell this
// batch of stock" flow) needs to write an income row inside its own
// transaction. No current caller needs it, but the shape costs nothing.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

// -- money in, kept out of Sales and Expenses (read this before adding
// anything here) ------------------------------------------------------------
//
// This is for income that ISN'T Sales revenue — the motivating case is
// selling a piece of capital equipment (an old stringing machine) once it's
// replaced. It must never be recorded as a Sale (would wrongly inflate the
// stringing/retail split in src/lib/financials.ts) and never as a negative
// Expense (would mislabel an income event as a cost everywhere the UI/CSV
// export/audit trail say "expense"). See getFinancialSummary in
// src/lib/financials.ts for exactly how this folds into Net Profit.

export type OtherIncome = typeof otherIncome.$inferSelect;
export type OtherIncomeStatus = OtherIncome["status"];
export type OtherIncomeAuditLogRow = typeof otherIncomeAuditLog.$inferSelect;

export interface OtherIncomeInput {
  incomeDate: string;
  description: string;
  category: string;
  source?: string | null;
  amountCents: number;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

function cleanInput(input: OtherIncomeInput) {
  return {
    incomeDate: input.incomeDate,
    description: input.description.trim(),
    category: input.category.trim(),
    source: input.source?.trim() || null,
    amountCents: input.amountCents,
    paymentMethod: input.paymentMethod?.trim() || null,
    referenceNumber: input.referenceNumber?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

async function writeAuditLog(tx: DbOrTx, otherIncomeId: string, action: string, oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null) {
  await tx.insert(otherIncomeAuditLog).values({ otherIncomeId, action, oldValues, newValues });
}

export async function createOtherIncome(input: OtherIncomeInput): Promise<OtherIncome> {
  return db.transaction(async (tx) => {
    const values = cleanInput(input);
    const [row] = await tx.insert(otherIncome).values(values).returning();
    await writeAuditLog(tx, row.id, "created", null, values);
    return row;
  });
}

export interface UpdateOtherIncomeResult {
  ok: boolean;
  reason?: "voided" | "not_found";
  income?: OtherIncome;
}

/** Same rules as updateExpense: createdAt untouched, a full before/after
 * snapshot goes to the audit log, and a voided record can't be edited
 * further (void it and record a fresh one instead). */
export async function updateOtherIncome(id: string, input: OtherIncomeInput): Promise<UpdateOtherIncomeResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(otherIncome).where(eq(otherIncome.id, id)).limit(1);
    if (!existing) return { ok: false, reason: "not_found" };
    if (existing.status === "voided") return { ok: false, reason: "voided" };

    const values = cleanInput(input);
    const [updated] = await tx
      .update(otherIncome)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(otherIncome.id, id))
      .returning();

    const oldSnapshot = { incomeDate: existing.incomeDate, description: existing.description, category: existing.category, source: existing.source, amountCents: existing.amountCents, paymentMethod: existing.paymentMethod };
    const newSnapshot = { incomeDate: values.incomeDate, description: values.description, category: values.category, source: values.source, amountCents: values.amountCents, paymentMethod: values.paymentMethod };
    await writeAuditLog(tx, id, "updated", oldSnapshot, newSnapshot);

    return { ok: true, income: updated };
  });
}

export interface VoidOtherIncomeResult {
  ok: boolean;
  reason?: "already_voided" | "not_found";
}

/** Never a delete — the row (and its income number) stays forever, just
 * excluded from every financial total from this point on, same append-only
 * philosophy as voidExpense. */
export async function voidOtherIncome(id: string, reason: string): Promise<VoidOtherIncomeResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(otherIncome).where(eq(otherIncome.id, id)).limit(1);
    if (!existing) return { ok: false, reason: "not_found" };
    if (existing.status === "voided") return { ok: false, reason: "already_voided" };

    await tx.update(otherIncome).set({ status: "voided", voidedAt: new Date(), voidReason: reason.trim(), updatedAt: new Date() }).where(eq(otherIncome.id, id));
    await writeAuditLog(tx, id, "voided", { status: existing.status }, { status: "voided", voidReason: reason.trim() });
    return { ok: true };
  });
}

export async function getOtherIncome(id: string): Promise<OtherIncome | null> {
  const [row] = await db.select().from(otherIncome).where(eq(otherIncome.id, id)).limit(1);
  return row ?? null;
}

export async function listOtherIncomeAuditLog(otherIncomeId: string): Promise<OtherIncomeAuditLogRow[]> {
  return db.select().from(otherIncomeAuditLog).where(eq(otherIncomeAuditLog.otherIncomeId, otherIncomeId)).orderBy(desc(otherIncomeAuditLog.createdAt));
}

// -- list / filter / paginate ------------------------------------------------

export interface OtherIncomeFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
  status?: OtherIncomeStatus | null;
}

function baseConditions(filters: OtherIncomeFilters) {
  const conditions = [];
  if (filters.dateFrom) conditions.push(gte(otherIncome.incomeDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(otherIncome.incomeDate, filters.dateTo));
  if (filters.status) conditions.push(eq(otherIncome.status, filters.status));
  const q = filters.search?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(sql`(
      ${otherIncome.incomeNumber} ilike ${like}
      or ${otherIncome.description} ilike ${like}
      or ${otherIncome.source} ilike ${like}
      or ${otherIncome.category} ilike ${like}
      or ${otherIncome.referenceNumber} ilike ${like}
    )`);
  }
  return conditions;
}

export interface OtherIncomePageParams extends OtherIncomeFilters {
  page: number;
  pageSize: number;
}

export interface OtherIncomePageResult {
  rows: OtherIncome[];
  totalCount: number;
}

/** Newest first, filtered and paginated in the database — same discipline
 * as listExpensesPage, even though this table is expected to stay small. */
export async function listOtherIncomePage(params: OtherIncomePageParams): Promise<OtherIncomePageResult> {
  const conditions = baseConditions(params);
  const where = conditions.length ? and(...conditions) : sql`true`;

  const [countRow] = await db.select({ count: sql<string>`count(*)` }).from(otherIncome).where(where);
  const totalCount = Number(countRow?.count ?? 0);

  const rows = await db
    .select()
    .from(otherIncome)
    .where(where)
    .orderBy(desc(otherIncome.incomeDate), desc(otherIncome.incomeNumber))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  return { rows, totalCount };
}

export async function listCategoriesInUse(): Promise<string[]> {
  const rows = await db.selectDistinct({ category: otherIncome.category }).from(otherIncome).orderBy(asc(otherIncome.category));
  return rows.map((r) => r.category);
}

// -- summary ------------------------------------------------------------

/** Recorded (not voided) total in range — the one number
 * getFinancialSummary folds into Net Profit (src/lib/financials.ts). */
export async function getOtherIncomeTotalCents(filters: OtherIncomeFilters): Promise<number> {
  const conditions = [...baseConditions(filters)];
  if (!filters.status) conditions.push(eq(otherIncome.status, "recorded"));
  const where = conditions.length ? and(...conditions) : sql`true`;
  const [row] = await db.select({ total: sql<string>`coalesce(sum(${otherIncome.amountCents}), 0)` }).from(otherIncome).where(where);
  return Number(row?.total ?? 0);
}

// -- CSV export ----------------------------------------------------------

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
}

export async function exportOtherIncomeCsv(filters: OtherIncomeFilters): Promise<string> {
  const conditions = baseConditions(filters);
  const where = conditions.length ? and(...conditions) : sql`true`;
  const rows = await db.select().from(otherIncome).where(where).orderBy(desc(otherIncome.incomeDate), desc(otherIncome.incomeNumber));
  return toCsv(
    ["Income number", "Date", "Description", "Category", "Source", "Amount (cents)", "Payment method", "Status", "Reference", "Notes"],
    rows.map((r) => [r.incomeNumber, r.incomeDate, r.description, r.category, r.source, r.amountCents, r.paymentMethod, r.status, r.referenceNumber, r.notes]),
  );
}
