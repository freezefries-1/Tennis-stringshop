import { and, asc, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { expenseAuditLog, expenseCategories, expenses, recurringExpenses } from "@/db/schema";
import { isForeignKeyViolation } from "./db-errors";

// A DB transaction handle (postgres-js/drizzle) or the top-level db itself —
// same pattern as string-inventory.ts/products.ts.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

// -- inventory-vs-expense (read this before adding anything here) ----------
//
// This file must never provide a way to record a stock purchase as an
// expense. Buying a $180 string reel or $1,200 of paddles is entered
// through Receive Stock (src/lib/string-inventory.ts / src/lib/products.ts),
// which creates an inventory batch — it becomes COGS only when that stock
// is sold, via the existing FIFO machinery (see src/lib/financials.ts).
// There is deliberately no "Inventory" category in DEFAULT_EXPENSE_CATEGORIES
// below, and the Add Expense form carries its own reminder of this. A
// courier fee for RECEIVING a shipment is a legitimate expense (the goods
// themselves are not) — the distinction is what was paid for, not who it
// was paid to.

export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type ExpenseTreatment = Expense["treatment"];
export type ExpenseStatus = Expense["status"];
export type ExpenseAuditLogRow = typeof expenseAuditLog.$inferSelect;

// -- categories --------------------------------------------------------------

const DEFAULT_EXPENSE_CATEGORIES = [
  "Software / Subscriptions",
  "Marketing / Advertising",
  "Transport / Delivery",
  "Packaging",
  "Office / Admin",
  "Equipment",
  "Equipment Maintenance",
  "Professional Fees",
  "Banking / Transaction Fees",
  "Training / Certification",
  "Tournament / Event Expenses",
  "Rent / Storage",
  "Utilities",
  "Insurance",
  "Phone / Internet",
  "Miscellaneous",
];

/** Seeds the suggested category list once, only if none exist yet — same
 * pattern as ensureDefaultCategories in products.ts. Never re-seeds once
 * the business has its own set (even if every one of them gets archived). */
export async function ensureDefaultExpenseCategories(): Promise<void> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(expenseCategories);
  if (count > 0) return;
  await db.insert(expenseCategories).values(DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ name })));
}

export async function listExpenseCategories(includeArchived = false): Promise<ExpenseCategory[]> {
  return db
    .select()
    .from(expenseCategories)
    .where(includeArchived ? sql`true` : isNull(expenseCategories.archivedAt))
    .orderBy(expenseCategories.name);
}

export async function createExpenseCategory(name: string): Promise<ExpenseCategory> {
  const [row] = await db.insert(expenseCategories).values({ name: name.trim() }).returning();
  return row;
}

export async function renameExpenseCategory(id: string, name: string): Promise<void> {
  await db.update(expenseCategories).set({ name: name.trim(), updatedAt: new Date() }).where(eq(expenseCategories.id, id));
}

export async function setExpenseCategoryArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(expenseCategories)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(eq(expenseCategories.id, id));
}

export async function deleteExpenseCategory(id: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    await db.delete(expenseCategories).where(eq(expenseCategories.id, id));
    return { ok: true };
  } catch (err) {
    if (isForeignKeyViolation(err)) return { ok: false, reason: "in_use" };
    throw err;
  }
}

// -- expenses ------------------------------------------------------------

export interface ExpenseInput {
  expenseDate: string;
  description: string;
  categoryId: string;
  vendor?: string | null;
  amountCents: number;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  receiptUrl?: string | null;
  notes?: string | null;
  treatment: ExpenseTreatment;
}

function cleanExpenseInput(input: ExpenseInput) {
  return {
    expenseDate: input.expenseDate,
    description: input.description.trim(),
    categoryId: input.categoryId,
    vendor: input.vendor?.trim() || null,
    amountCents: input.amountCents,
    paymentMethod: input.paymentMethod?.trim() || null,
    referenceNumber: input.referenceNumber?.trim() || null,
    receiptUrl: input.receiptUrl?.trim() || null,
    notes: input.notes?.trim() || null,
    treatment: input.treatment,
  };
}

/** Same-date + same-vendor + same-amount + same-description is a soft
 * warning (brief §44 — "warn rather than overrestrict", two identical
 * expenses can legitimately both happen), not a hard block. Voided
 * expenses are excluded — a voided duplicate isn't a live duplicate. */
export async function findPossibleDuplicateExpense(expenseDate: string, vendor: string | null, amountCents: number, description: string, excludeId?: string): Promise<Expense | null> {
  const [row] = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.expenseDate, expenseDate),
        eq(expenses.amountCents, amountCents),
        eq(expenses.status, "recorded"),
        vendor ? sql`lower(${expenses.vendor}) = lower(${vendor})` : sql`${expenses.vendor} is null`,
        sql`lower(${expenses.description}) = lower(${description})`,
        excludeId ? sql`${expenses.id} != ${excludeId}` : sql`true`,
      ),
    )
    .limit(1);
  return row ?? null;
}

async function writeAuditLog(tx: DbOrTx, expenseId: string, action: string, oldValues: Record<string, unknown> | null, newValues: Record<string, unknown> | null) {
  await tx.insert(expenseAuditLog).values({ expenseId, action, oldValues, newValues });
}

/** recurringExpenseId is intentionally not part of ExpenseInput — it's set
 * only by generateDueExpense (src/lib/recurring-expenses.ts), never by a
 * user directly typing one into the create form.
 *
 * Accepts an optional transaction handle so a caller that's already inside
 * its own db.transaction() (generateDueExpense, holding a row lock on the
 * recurring_expenses template via SELECT ... FOR UPDATE) can pass it
 * through instead of this function opening a second, independent
 * transaction — postgres.js hands nested db.transaction() calls a
 * different pooled connection than the outer one, which deadlocks the
 * moment the outer transaction is holding a lock the inner one's own
 * work depends on. Every other caller (the Add Expense form, CSV import)
 * has no outer transaction and simply omits this, so createExpense opens
 * its own as before. */
export async function createExpense(input: ExpenseInput, recurringExpenseId?: string | null, tx?: Tx): Promise<Expense> {
  const run = async (t: DbOrTx) => {
    const values = { ...cleanExpenseInput(input), recurringExpenseId: recurringExpenseId ?? null };
    const [row] = await t.insert(expenses).values(values).returning();
    await writeAuditLog(t, row.id, "created", null, values);
    return row;
  };
  return tx ? run(tx) : db.transaction(run);
}

export interface UpdateExpenseResult {
  ok: boolean;
  reason?: "voided" | "not_found";
  expense?: Expense;
}

/** createdAt is never touched; updatedAt bumps on every save. A financially
 * material edit (amount/date/category — brief §9) gets a full before/after
 * audit row, same as any other edit, so "what did this used to say" stays
 * reconstructable rather than silently overwritten. A voided expense can't
 * be edited further — Void is meant to be the last word on a mistaken
 * entry; correcting it means voiding and recording a fresh one. */
export async function updateExpense(id: string, input: ExpenseInput): Promise<UpdateExpenseResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!existing) return { ok: false, reason: "not_found" };
    if (existing.status === "voided") return { ok: false, reason: "voided" };

    const values = cleanExpenseInput(input);
    const [updated] = await tx
      .update(expenses)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();

    const oldSnapshot = {
      expenseDate: existing.expenseDate,
      description: existing.description,
      categoryId: existing.categoryId,
      vendor: existing.vendor,
      amountCents: existing.amountCents,
      paymentMethod: existing.paymentMethod,
      treatment: existing.treatment,
    };
    const newSnapshot = { expenseDate: values.expenseDate, description: values.description, categoryId: values.categoryId, vendor: values.vendor, amountCents: values.amountCents, paymentMethod: values.paymentMethod, treatment: values.treatment };
    await writeAuditLog(tx, id, "updated", oldSnapshot, newSnapshot);

    return { ok: true, expense: updated };
  });
}

export interface VoidExpenseResult {
  ok: boolean;
  reason?: "already_voided" | "not_found";
}

/** Never a delete — the row (and its expense_number) stays forever, just
 * excluded from every financial total from this point on (brief §8/§33).
 * Voiding an already-voided expense is a no-op-with-a-reason, not an error,
 * since a double-click/retry should never crash the page. */
export async function voidExpense(id: string, reason: string): Promise<VoidExpenseResult> {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    if (!existing) return { ok: false, reason: "not_found" };
    if (existing.status === "voided") return { ok: false, reason: "already_voided" };

    await tx.update(expenses).set({ status: "voided", voidedAt: new Date(), voidReason: reason.trim(), updatedAt: new Date() }).where(eq(expenses.id, id));
    await writeAuditLog(tx, id, "voided", { status: existing.status }, { status: "voided", voidReason: reason.trim() });
    return { ok: true };
  });
}

export interface ExpenseDetail extends Expense {
  categoryName: string;
  recurringDescription: string | null;
}

export async function getExpense(id: string): Promise<ExpenseDetail | null> {
  const [row] = await db
    .select({ expense: expenses, categoryName: expenseCategories.name, recurringDescription: recurringExpenses.description })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .leftJoin(recurringExpenses, eq(recurringExpenses.id, expenses.recurringExpenseId))
    .where(eq(expenses.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.expense, categoryName: row.categoryName, recurringDescription: row.recurringDescription };
}

export async function listExpenseAuditLog(expenseId: string): Promise<ExpenseAuditLogRow[]> {
  return db.select().from(expenseAuditLog).where(eq(expenseAuditLog.expenseId, expenseId)).orderBy(desc(expenseAuditLog.createdAt));
}

// -- list / filter / paginate ------------------------------------------------

export interface ExpenseFilters {
  /** Inclusive lower bound on expenseDate. Null/undefined = no lower bound. */
  dateFrom?: string | null;
  /** Exclusive upper bound on expenseDate. Null/undefined = no upper bound. */
  dateTo?: string | null;
  search?: string | null;
  categoryId?: string | null;
  paymentMethod?: string | null;
  /** true = recurring-generated only, false = one-off only, null/undefined = both. */
  recurringOnly?: boolean | null;
  status?: ExpenseStatus | null;
  treatment?: ExpenseTreatment | null;
}

function baseExpenseConditions(filters: ExpenseFilters) {
  const conditions = [];
  if (filters.dateFrom) conditions.push(gte(expenses.expenseDate, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(expenses.expenseDate, filters.dateTo));
  if (filters.categoryId) conditions.push(eq(expenses.categoryId, filters.categoryId));
  if (filters.paymentMethod) conditions.push(eq(expenses.paymentMethod, filters.paymentMethod));
  if (filters.status) conditions.push(eq(expenses.status, filters.status));
  if (filters.treatment) conditions.push(eq(expenses.treatment, filters.treatment));
  if (filters.recurringOnly === true) conditions.push(sql`${expenses.recurringExpenseId} is not null`);
  if (filters.recurringOnly === false) conditions.push(isNull(expenses.recurringExpenseId));
  const q = filters.search?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(sql`(
      ${expenses.expenseNumber} ilike ${like}
      or ${expenses.description} ilike ${like}
      or ${expenses.vendor} ilike ${like}
      or ${expenses.referenceNumber} ilike ${like}
      or exists (select 1 from ${expenseCategories} c where c.id = ${expenses.categoryId} and c.name ilike ${like})
    )`);
  }
  return conditions;
}

export interface ExpenseListRow {
  id: string;
  expenseNumber: string;
  expenseDate: string;
  description: string;
  categoryName: string;
  vendor: string | null;
  amountCents: number;
  paymentMethod: string | null;
  status: ExpenseStatus;
  treatment: ExpenseTreatment;
  hasReceipt: boolean;
  isRecurring: boolean;
  notes: string | null;
}

export interface ExpensePageParams extends ExpenseFilters {
  page: number;
  pageSize: number;
}

export interface ExpensePageResult {
  rows: ExpenseListRow[];
  totalCount: number;
}

/** Newest first, filtered and paginated entirely in the database (brief
 * §41 — never fetch every historical Expense into the browser). */
export async function listExpensesPage(params: ExpensePageParams): Promise<ExpensePageResult> {
  const conditions = baseExpenseConditions(params);
  const where = conditions.length ? and(...conditions) : sql`true`;

  const [countRow] = await db.select({ count: sql<string>`count(*)` }).from(expenses).where(where);
  const totalCount = Number(countRow?.count ?? 0);

  const rows = await db
    .select({ expense: expenses, categoryName: expenseCategories.name })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(where)
    .orderBy(desc(expenses.expenseDate), desc(expenses.expenseNumber))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  return {
    rows: rows.map((r) => ({
      id: r.expense.id,
      expenseNumber: r.expense.expenseNumber,
      expenseDate: r.expense.expenseDate,
      description: r.expense.description,
      categoryName: r.categoryName,
      vendor: r.expense.vendor,
      amountCents: r.expense.amountCents,
      paymentMethod: r.expense.paymentMethod,
      status: r.expense.status,
      treatment: r.expense.treatment,
      hasReceipt: !!r.expense.receiptUrl,
      isRecurring: !!r.expense.recurringExpenseId,
      notes: r.expense.notes,
    })),
    totalCount,
  };
}

/** Powers the Vendor field's autocomplete (brief §11 — "simple text entry
 * with useful autocomplete from previous vendors", not a vendor-management
 * system). */
export async function listVendorsInUse(): Promise<string[]> {
  const rows = await db.selectDistinct({ vendor: expenses.vendor }).from(expenses).where(sql`${expenses.vendor} is not null`).orderBy(asc(expenses.vendor));
  return rows.map((r) => r.vendor).filter((v): v is string => !!v);
}

export async function listRecentExpenses(limit = 8): Promise<ExpenseListRow[]> {
  const { rows } = await listExpensesPage({ page: 1, pageSize: limit, status: "recorded" });
  return rows;
}

// -- summary -----------------------------------------------------------------

export interface ExpenseCategoryAmount {
  categoryId: string;
  categoryName: string;
  amountCents: number;
  percentOfTotal: number;
}

export interface ExpenseSummary {
  /** Operating expenses only — excludes voided and treatment='capital'
   * (see the file-level comment in financials.ts for why capital purchases
   * aren't folded into this figure). This is the number Net Profit
   * subtracts. */
  operatingTotalCents: number;
  /** Recorded (not voided) capital/equipment purchases — shown separately,
   * never subtracted from Net Profit this phase (brief §7). */
  capitalTotalCents: number;
  operatingCount: number;
  byCategory: ExpenseCategoryAmount[];
}

/** Voided expenses never contribute here regardless of which status filter
 * is applied to the underlying list (brief §33) — the one exception is if
 * the caller explicitly asks to filter status='voided' themselves, in which
 * case they're deliberately looking at voided rows and get $0 back, same
 * "showing what you asked for" honesty as Sales' cancelled-only view. */
export async function getExpenseSummary(filters: ExpenseFilters): Promise<ExpenseSummary> {
  const conditions = [...baseExpenseConditions(filters)];
  if (!filters.status) conditions.push(eq(expenses.status, "recorded"));
  const where = conditions.length ? and(...conditions) : sql`true`;
  const operatingWhere = and(where, eq(expenses.treatment, "operating"));
  const capitalWhere = and(where, eq(expenses.treatment, "capital"));

  const [[operatingRow], [capitalRow], categoryRows] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${expenses.amountCents}), 0)`, count: sql<string>`count(*)` }).from(expenses).where(operatingWhere),
    db.select({ total: sql<string>`coalesce(sum(${expenses.amountCents}), 0)` }).from(expenses).where(capitalWhere),
    db
      .select({ categoryId: expenseCategories.id, categoryName: expenseCategories.name, total: sql<string>`coalesce(sum(${expenses.amountCents}), 0)` })
      .from(expenses)
      .innerJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
      .where(operatingWhere)
      .groupBy(expenseCategories.id, expenseCategories.name)
      .orderBy(sql`sum(${expenses.amountCents}) desc`),
  ]);

  const operatingTotalCents = Number(operatingRow?.total ?? 0);
  const byCategory = categoryRows
    .map((r) => ({ categoryId: r.categoryId, categoryName: r.categoryName, amountCents: Number(r.total), percentOfTotal: operatingTotalCents > 0 ? (Number(r.total) / operatingTotalCents) * 100 : 0 }))
    .filter((r) => r.amountCents !== 0);

  return {
    operatingTotalCents,
    capitalTotalCents: Number(capitalRow?.total ?? 0),
    operatingCount: Number(operatingRow?.count ?? 0),
    byCategory,
  };
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

export async function exportExpensesCsv(filters: ExpenseFilters): Promise<string> {
  const conditions = baseExpenseConditions(filters);
  const where = conditions.length ? and(...conditions) : sql`true`;
  const rows = await db
    .select({ expense: expenses, categoryName: expenseCategories.name })
    .from(expenses)
    .innerJoin(expenseCategories, eq(expenseCategories.id, expenses.categoryId))
    .where(where)
    .orderBy(desc(expenses.expenseDate), desc(expenses.expenseNumber));
  return toCsv(
    ["Expense number", "Date", "Description", "Category", "Vendor", "Amount (cents)", "Payment method", "Status", "Treatment", "Recurring/One-off", "Reference", "Notes"],
    rows.map((r) => [
      r.expense.expenseNumber,
      r.expense.expenseDate,
      r.expense.description,
      r.categoryName,
      r.expense.vendor,
      r.expense.amountCents,
      r.expense.paymentMethod,
      r.expense.status,
      r.expense.treatment,
      r.expense.recurringExpenseId ? "Recurring" : "One-off",
      r.expense.referenceNumber,
      r.expense.notes,
    ]),
  );
}

// -- CSV import ----------------------------------------------------------

export interface ExpenseImportRow {
  rowIndex: number;
  expenseDate: string;
  description: string;
  categoryName: string;
  vendor: string | null;
  amountCents: number;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
  errors: string[];
  possibleDuplicate: boolean;
  looksLikeInventory: boolean;
}

const INVENTORY_HINT_WORDS = ["reel", "reels", "string set", "racket", "rackets", "paddle", "paddles", "batch", "stock purchase", "inventory"];

/** Parses + validates a CSV of expenses to import, one pass, entirely in
 * memory — never writes anything (brief §43: "do not silently import
 * malformed records", upload -> validate -> preview -> confirm are
 * separate steps; this is just the first two). Column headers expected:
 * Date, Description, Category, Vendor, Amount, Payment Method, Reference,
 * Notes (case-insensitive, order-independent). */
export async function parseExpenseImportCsv(csvText: string): Promise<ExpenseImportRow[]> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const splitLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cur += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);
    return cells;
  };

  const header = splitLine(lines[0]).map((h) => h.trim().toLowerCase());
  const colIndex = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const idx = {
    date: colIndex("date", "expense date"),
    description: colIndex("description"),
    category: colIndex("category"),
    vendor: colIndex("vendor", "payee"),
    amount: colIndex("amount"),
    paymentMethod: colIndex("payment method"),
    reference: colIndex("reference", "reference number"),
    notes: colIndex("notes"),
  };

  const categories = await listExpenseCategories(true);
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

  const dataLines = lines.slice(1);
  const rows: ExpenseImportRow[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cells = splitLine(dataLines[i]);
    const errors: string[] = [];

    const rawDate = idx.date >= 0 ? cells[idx.date]?.trim() : "";
    const description = idx.description >= 0 ? cells[idx.description]?.trim() ?? "" : "";
    const categoryName = idx.category >= 0 ? cells[idx.category]?.trim() ?? "" : "";
    const vendor = idx.vendor >= 0 ? cells[idx.vendor]?.trim() || null : null;
    const rawAmount = idx.amount >= 0 ? cells[idx.amount]?.trim() : "";
    const paymentMethod = idx.paymentMethod >= 0 ? cells[idx.paymentMethod]?.trim() || null : null;
    const referenceNumber = idx.reference >= 0 ? cells[idx.reference]?.trim() || null : null;
    const notes = idx.notes >= 0 ? cells[idx.notes]?.trim() || null : null;

    let expenseDate = "";
    if (!rawDate) errors.push("Missing date");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) && Number.isNaN(Date.parse(rawDate))) errors.push(`Unrecognised date "${rawDate}"`);
    else expenseDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : new Date(rawDate).toISOString().slice(0, 10);

    if (!description) errors.push("Missing description");
    if (!categoryName) errors.push("Missing category");
    else if (!categoryByName.has(categoryName.toLowerCase())) errors.push(`Unknown category "${categoryName}" — create it first`);

    let amountCents = 0;
    const parsedAmount = Number.parseFloat((rawAmount || "").replace(/[^0-9.-]/g, ""));
    if (!rawAmount || Number.isNaN(parsedAmount)) errors.push("Missing/invalid amount");
    else amountCents = Math.round(parsedAmount * 100);
    if (amountCents <= 0 && !errors.some((e) => e.includes("amount"))) errors.push("Amount must be greater than zero");

    const haystack = `${description} ${categoryName}`.toLowerCase();
    const looksLikeInventory = INVENTORY_HINT_WORDS.some((w) => haystack.includes(w));

    let possibleDuplicate = false;
    if (errors.length === 0) {
      const dup = await findPossibleDuplicateExpense(expenseDate, vendor, amountCents, description);
      possibleDuplicate = !!dup;
    }

    rows.push({ rowIndex: i + 2, expenseDate, description, categoryName, vendor, amountCents, paymentMethod, referenceNumber, notes, errors, possibleDuplicate, looksLikeInventory });
  }
  return rows;
}

export interface ImportExpensesResult {
  created: number;
  skipped: number;
}

/** Only ever called with rows the UI has already shown the user in preview
 * — re-validates category existence server-side too (never trust a
 * client-supplied categoryName blindly), skips anything that still fails. */
export async function importExpenses(rows: { expenseDate: string; description: string; categoryName: string; vendor: string | null; amountCents: number; paymentMethod: string | null; referenceNumber: string | null; notes: string | null }[]): Promise<ImportExpensesResult> {
  const categories = await listExpenseCategories(true);
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const category = categoryByName.get(row.categoryName.toLowerCase());
    if (!category || !row.expenseDate || !row.description || row.amountCents <= 0) {
      skipped++;
      continue;
    }
    await createExpense({
      expenseDate: row.expenseDate,
      description: row.description,
      categoryId: category.id,
      vendor: row.vendor,
      amountCents: row.amountCents,
      paymentMethod: row.paymentMethod,
      referenceNumber: row.referenceNumber,
      notes: row.notes,
      treatment: "operating",
    });
    created++;
  }
  return { created, skipped };
}
