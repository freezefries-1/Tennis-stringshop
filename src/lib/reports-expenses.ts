// Phase 8 — Reports → Financial (expense breakdowns). getExpenseBreakdown
// (financials.ts, unchanged) already gives by-category totals with the
// exact same operating/capital treatment /financials uses — reused here
// rather than re-summed, so this report can't disagree with it. Only
// genuinely new breakdowns (by month, recurring vs one-off) are added.

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ExpensesByMonthRow {
  year: number;
  month: number;
  label: string;
  operatingCents: number;
  capitalCents: number;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** monthsBack calendar months ending at (and including) the current month,
 * one grouped query (not one-per-month) — same reasoning as
 * getMonthlyTrend's rewrite. Voided expenses excluded throughout (status
 * filter), matching every other expense total in this app. */
export async function getExpensesByMonth(monthsBack = 12): Promise<ExpensesByMonthRow[]> {
  const now = new Date();
  const targets: { year: number; month: number; start: Date; end: Date }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    targets.push({ year: d.getFullYear(), month: d.getMonth() + 1, start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) });
  }
  const overallStartStr = toDateStr(targets[0].start);
  const overallEndStr = toDateStr(targets[targets.length - 1].end);

  const bucketCase = sql.join(
    targets.map((t, i) => sql`when ${expenses.expenseDate} >= ${toDateStr(t.start)} and ${expenses.expenseDate} < ${toDateStr(t.end)} then ${i}`),
    sql` `,
  );
  const idxExpr = sql<number>`case ${bucketCase} end`;

  const rows = await db
    .select({
      idx: idxExpr,
      operating: sql<string>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.treatment} = 'operating'), 0)`,
      capital: sql<string>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.treatment} = 'capital'), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.status, "recorded"), sql`${expenses.expenseDate} >= ${overallStartStr} and ${expenses.expenseDate} < ${overallEndStr}`))
    .groupBy(sql`1`);

  const map = new Map(rows.map((r) => [Number(r.idx), r]));
  return targets.map((t, i) => {
    const r = map.get(i);
    return { year: t.year, month: t.month, label: `${MONTH_NAMES[t.month - 1]} ${t.year}`, operatingCents: Number(r?.operating ?? 0), capitalCents: Number(r?.capital ?? 0) };
  });
}

export interface RecurringVsOneOffRow {
  kind: "recurring" | "one_off";
  count: number;
  totalCents: number;
}

export async function getRecurringVsOneOff(dateFrom: string | null, dateTo: string | null): Promise<RecurringVsOneOffRow[]> {
  const conditions = [eq(expenses.status, "recorded"), eq(expenses.treatment, "operating")];
  if (dateFrom) conditions.push(sql`${expenses.expenseDate} >= ${dateFrom}`);
  if (dateTo) conditions.push(sql`${expenses.expenseDate} < ${dateTo}`);

  const rows = await db
    .select({ isRecurring: sql<boolean>`${expenses.recurringExpenseId} is not null`, count: sql<number>`count(*)::int`, total: sql<string>`coalesce(sum(${expenses.amountCents}), 0)` })
    .from(expenses)
    .where(and(...conditions))
    .groupBy(sql`${expenses.recurringExpenseId} is not null`);

  return rows.map((r) => ({ kind: r.isRecurring ? ("recurring" as const) : ("one_off" as const), count: r.count, totalCents: Number(r.total) }));
}
