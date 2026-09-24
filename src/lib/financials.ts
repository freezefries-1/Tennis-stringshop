import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sales, saleItems, expenses, otherIncome } from "@/db/schema";
import { getSalesSummary, type SalesFilters } from "./sales";
import { getExpenseSummary, type ExpenseCategoryAmount } from "./expenses";
import { getOtherIncomeTotalCents } from "./other-income";
import { previousPeriod, safePctChange } from "./date-filter";
import { toCsv } from "./csv";

// -- the P&L formulas (read this before editing) ----------------------------
//
// NET SALES REVENUE = sum(sales.totalCents) for completed-or-partially-
// refunded sales in range, EXCLUDING cancelled — already net of returns,
// because a return is stored as its own reversing Sale with a negative
// totalCents (see returnSaleItem in sales.ts), not an edit to the original.
// This is exactly getSalesSummary().netRevenueCents, reused here rather
// than re-derived — Sales stays the single financial source of truth
// (Phase 6's rule, unchanged by this phase).
//
// COGS = sum(sale_items.cogsAmountCents) for those same sales — every line
// item's cost, FIFO-computed at sale time for product/string_product/
// string_job_service lines, or the caller-supplied manualCogsCents (often
// 0) for a 'custom' line. Also already net of returns (a reversing sale's
// line items carry negative cogsAmountCents too).
//
// GROSS PROFIT = NET SALES REVENUE - COGS.
//
// OPERATING EXPENSES = sum(expenses.amountCents) where status='recorded'
// AND treatment='operating', expenseDate in range. Two things are
// DELIBERATELY excluded from this figure:
//   1. Inventory purchases — never enter the expenses table at all (see
//      the file comment in expenses.ts and schema.ts). Their cost is
//      already inside COGS above, via FIFO, the moment the stock sells.
//      Recording a $180 reel here too would subtract it a second time.
//   2. Capital/equipment purchases (treatment='capital') — recorded and
//      visible (capitalExpensesCents below) but NOT subtracted from Net
//      Profit this phase (brief §7). There's no depreciation/fixed-asset
//      schedule yet; immediately expensing a large one-off purchase would
//      make a single month look artificially unprofitable. This mirrors
//      the inventory principle: a cost silently subtracted at the wrong
//      time misstates profit just as much as a cost double-counted.
//
// OTHER INCOME = sum(other_income.amountCents) where status='recorded',
// incomeDate in range — money in that isn't Sales revenue (the motivating
// case: selling a piece of capital equipment once it's replaced). Never
// folded into Sales (would wrongly inflate the stringing/retail split) or
// into Expenses as a negative number (would mislabel it as a cost
// everywhere the UI/CSV export/audit trail say "expense") — see the file
// comment in other-income.ts.
//
// NET PROFIT = GROSS PROFIT - OPERATING EXPENSES + OTHER INCOME.
//
// OVERALL PROFIT = NET PROFIT - CAPITAL EXPENSES. A second, "everything
// counted" bottom line — Net Profit deliberately leaves capital purchases
// out so one big equipment buy doesn't wreck a single month's comparison,
// but that same exclusion means Net Profit alone overstates the business
// if you're asking a whole-business question like "have I broken even" —
// it would count the CASH IN from selling an old machine (via Other
// Income) without ever counting the CASH OUT from buying one. Overall
// Profit puts both sides back in, so it's the figure to check breakeven
// against, especially over All time/YTD rather than a single month.
//
// No margin is ever computed against a zero-revenue denominator — each
// comes back `null` (not 0, not NaN, not clamped) when netSalesRevenueCents
// is 0, and the UI shows "—" rather than a misleading 0.0%.

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local-calendar-day string from a Date already representing local
 * midnight of that day (the same boundary convention used by the Sales
 * and Products date filters) — expenses.expenseDate is a plain DATE
 * column, so it's compared against calendar-day strings, not instants. */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface FinancialsFilters {
  /** Inclusive lower bound, local-midnight Date. Null/undefined = All time. */
  dateFrom?: Date | null;
  /** Exclusive upper bound, local-midnight Date. */
  dateTo?: Date | null;
}

async function getUnknownCogsRevenueCents(filters: FinancialsFilters): Promise<number> {
  const conditions = [sql`${sales.status} != 'cancelled'`, eq(saleItems.itemType, "custom"), eq(saleItems.cogsAmountCents, 0)];
  if (filters.dateFrom) conditions.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(sales.occurredAt, filters.dateTo));
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)` })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(and(...conditions));
  return Number(row?.total ?? 0);
}

export interface FinancialSummary {
  netSalesRevenueCents: number;
  saleCount: number;
  cogsCents: number;
  grossProfitCents: number;
  /** null only when netSalesRevenueCents is 0 — never a misleading 0%. */
  grossMarginPct: number | null;
  operatingExpensesCents: number;
  /** Recorded (never voided) capital/equipment purchases in range — shown
   * for visibility, NOT subtracted from netProfitCents (see file comment). */
  capitalExpensesCents: number;
  /** Money in that isn't Sales revenue (e.g. selling old equipment) — ADDED
   * into netProfitCents, shown as its own line so it's never confused with
   * Sales Revenue (see file comment / other-income.ts). */
  otherIncomeCents: number;
  netProfitCents: number;
  netMarginPct: number | null;
  /** netProfitCents - capitalExpensesCents — the "everything counted"
   * bottom line, including capital purchases (which netProfitCents leaves
   * out on purpose). This is the figure to check whole-business breakeven
   * against, not netProfitCents (see file comment). */
  overallProfitCents: number;
  overallMarginPct: number | null;
  /** Outstanding balance on unpaid/partially-paid primary sales in range —
   * a receivable, not revenue and not an expense; never changes netProfit. */
  outstandingCents: number;
  /** Cash collected in range — distinct from netSalesRevenueCents, which is
   * accrual-based (brief §23: never label this "Revenue"). */
  paymentsReceivedCents: number;
  /** Data-quality signal (brief §35): revenue from 'custom' sale-item
   * lines with no recorded cost (cogsAmountCents = 0). The schema doesn't
   * distinguish "deliberately free" from "cost never entered", so this is
   * an approximation, not a certainty — documented as a known limitation. */
  revenueWithUnknownCogsCents: number;
  pctRevenueWithKnownCogs: number | null;
}

export async function getFinancialSummary(filters: FinancialsFilters): Promise<FinancialSummary> {
  const salesFilters: SalesFilters = { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
  const expenseDateFrom = filters.dateFrom ? toDateStr(filters.dateFrom) : null;
  const expenseDateTo = filters.dateTo ? toDateStr(filters.dateTo) : null;

  const [salesSummary, expenseSummary, otherIncomeCents, unknownCogsRevenueCents] = await Promise.all([
    getSalesSummary(salesFilters),
    getExpenseSummary({ dateFrom: expenseDateFrom, dateTo: expenseDateTo }),
    getOtherIncomeTotalCents({ dateFrom: expenseDateFrom, dateTo: expenseDateTo }),
    getUnknownCogsRevenueCents(filters),
  ]);

  const netProfitCents = salesSummary.grossProfitCents - expenseSummary.operatingTotalCents + otherIncomeCents;
  const overallProfitCents = netProfitCents - expenseSummary.capitalTotalCents;
  const grossMarginPct = salesSummary.netRevenueCents !== 0 ? (salesSummary.grossProfitCents / salesSummary.netRevenueCents) * 100 : null;
  const netMarginPct = salesSummary.netRevenueCents !== 0 ? (netProfitCents / salesSummary.netRevenueCents) * 100 : null;
  const overallMarginPct = salesSummary.netRevenueCents !== 0 ? (overallProfitCents / salesSummary.netRevenueCents) * 100 : null;
  const pctRevenueWithKnownCogs = salesSummary.netRevenueCents !== 0 ? ((salesSummary.netRevenueCents - unknownCogsRevenueCents) / salesSummary.netRevenueCents) * 100 : null;

  return {
    netSalesRevenueCents: salesSummary.netRevenueCents,
    saleCount: salesSummary.saleCount,
    cogsCents: salesSummary.cogsCents,
    grossProfitCents: salesSummary.grossProfitCents,
    grossMarginPct,
    operatingExpensesCents: expenseSummary.operatingTotalCents,
    capitalExpensesCents: expenseSummary.capitalTotalCents,
    otherIncomeCents,
    netProfitCents,
    netMarginPct,
    overallProfitCents,
    overallMarginPct,
    outstandingCents: salesSummary.unpaidCents,
    paymentsReceivedCents: salesSummary.paymentsReceivedCents,
    revenueWithUnknownCogsCents: unknownCogsRevenueCents,
    pctRevenueWithKnownCogs,
  };
}

export interface ExpenseBreakdown {
  operatingTotalCents: number;
  capitalTotalCents: number;
  byCategory: ExpenseCategoryAmount[];
}

export async function getExpenseBreakdown(filters: FinancialsFilters): Promise<ExpenseBreakdown> {
  const expenseDateFrom = filters.dateFrom ? toDateStr(filters.dateFrom) : null;
  const expenseDateTo = filters.dateTo ? toDateStr(filters.dateTo) : null;
  const summary = await getExpenseSummary({ dateFrom: expenseDateFrom, dateTo: expenseDateTo });
  return { operatingTotalCents: summary.operatingTotalCents, capitalTotalCents: summary.capitalTotalCents, byCategory: summary.byCategory };
}

// -- stringing vs retail split (brief §27/§28/§29/§30) -----------------------
//
// A Sale is never classified as a whole — its own sale_items are, by
// itemType. 'string_job_service' -> Stringing (labour, string cost, grip
// service, ...); 'product'/'string_product' -> Retail (a grip sold on its
// own, a whole reel sold retail, a paddle, ...); 'custom' -> Other, since
// a custom line could be either and there's no reliable signal to bucket
// it automatically. A mixed Sale (stringing + an overgrip) contributes to
// both buckets from its own line items, never double-counted and never
// forced into one label for the whole Sale.
//
// The three buckets sum to sales.subtotalCents (before any SALE-level
// discount), not sales.totalCents (after it) — a sale-level discount has
// no natural per-line attribution. saleLevelDiscountCents below is the
// reconciling figure: bucket totals - saleLevelDiscountCents = Net Sales
// Revenue, so the split is never mysterious even when a sale-level
// discount was applied (brief §53).

export interface SalesSplitBucket {
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
}

export interface SalesSplit {
  stringing: SalesSplitBucket;
  retail: SalesSplitBucket;
  other: SalesSplitBucket;
  saleLevelDiscountCents: number;
}

export async function getSalesSplit(filters: FinancialsFilters): Promise<SalesSplit> {
  const conditions = [sql`${sales.status} != 'cancelled'`];
  if (filters.dateFrom) conditions.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(sales.occurredAt, filters.dateTo));

  const [itemRows, [discountRow]] = await Promise.all([
    db
      .select({ itemType: saleItems.itemType, revenue: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)`, cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)` })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(and(...conditions))
      .groupBy(saleItems.itemType),
    db
      .select({ total: sql<string>`coalesce(sum(${sales.discountCents}), 0)` })
      .from(sales)
      .where(and(...conditions)),
  ]);

  const bucket = (types: string[]): SalesSplitBucket => {
    const matching = itemRows.filter((r) => types.includes(r.itemType));
    const revenueCents = matching.reduce((sum, r) => sum + Number(r.revenue), 0);
    const cogsCents = matching.reduce((sum, r) => sum + Number(r.cogs), 0);
    return { revenueCents, cogsCents, grossProfitCents: revenueCents - cogsCents };
  };

  return {
    stringing: bucket(["string_job_service"]),
    retail: bucket(["product", "string_product"]),
    other: bucket(["custom"]),
    saleLevelDiscountCents: Number(discountRow?.total ?? 0),
  };
}

// -- monthly view + trend (brief §36/§37) ------------------------------------
//
// No separate monthly tables, ever (brief §36/§51) — every figure here is
// the same getFinancialSummary() query above, scoped to a [1st, next 1st)
// window computed on the fly.

export function monthRange(year: number, month1to12: number): [Date, Date] {
  return [new Date(year, month1to12 - 1, 1), new Date(year, month1to12, 1)];
}

export interface MonthlyFinancials extends FinancialSummary {
  year: number;
  month: number;
  label: string;
}

export async function getMonthlyFinancials(year: number, month1to12: number): Promise<MonthlyFinancials> {
  const [dateFrom, dateTo] = monthRange(year, month1to12);
  const summary = await getFinancialSummary({ dateFrom, dateTo });
  return { ...summary, year, month: month1to12, label: `${MONTH_NAMES[month1to12 - 1]} ${year}` };
}

export interface MonthlyTrendRow {
  year: number;
  month: number;
  label: string;
  netSalesRevenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  operatingExpensesCents: number;
  otherIncomeCents: number;
  netProfitCents: number;
}

/** Oldest first, ending at (and including) the given year/month —
 * defaults to the current calendar month. Six months by default, matching
 * the brief's own Apr-Sep example; kept as a supporting view only, not
 * the full Phase 8 trend/analytics dashboard.
 *
 * Deliberately NOT built on getMonthlyFinancials/getFinancialSummary — that
 * would be one call per month, and getFinancialSummary alone is ~10 DB
 * round trips, so 6 months was ~60 near-simultaneous connections on top of
 * whatever else the page was already doing (this is what made /financials
 * slow again after it started defaulting to All time — see the dashboard
 * timeout fix for the same class of bug). Instead this buckets every row in
 * ONE query per underlying table (sales, sale_items, expenses,
 * other_income) using an explicit SQL CASE over each month's own [start,
 * end) boundary — the exact same boundary values monthRange() produces —
 * rather than SQL-side date_trunc, so bucketing can never disagree with
 * getFinancialSummary's own local-calendar-month semantics over a
 * DB-session-timezone-dependent truncation. */
export async function getMonthlyTrend(monthsBack = 6, endYear?: number, endMonth?: number): Promise<MonthlyTrendRow[]> {
  const now = new Date();
  const anchorYear = endYear ?? now.getFullYear();
  const anchorMonth = endMonth ?? now.getMonth() + 1;

  const targets: { year: number; month: number; start: Date; end: Date }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(anchorYear, anchorMonth - 1 - i, 1);
    const [start, end] = monthRange(d.getFullYear(), d.getMonth() + 1);
    targets.push({ year: d.getFullYear(), month: d.getMonth() + 1, start, end });
  }
  const overallStart = targets[0].start;
  const overallEnd = targets[targets.length - 1].end;
  const overallStartStr = toDateStr(overallStart);
  const overallEndStr = toDateStr(overallEnd);

  // sales.occurredAt is timestamptz — bucketed against the exact JS Date
  // boundaries above, same as every other sales date filter in this file.
  // Serialized to ISO strings explicitly: unlike gte()/lt() (which know the
  // column's type and convert automatically), a raw Date interpolated
  // straight into a `sql` template isn't converted by postgres.js and fails
  // at bind time — this is exactly what surfaced on first attempt here.
  const salesBucket = sql.join(
    targets.map((t, i) => sql`when ${sales.occurredAt} >= ${t.start.toISOString()} and ${sales.occurredAt} < ${t.end.toISOString()} then ${i}`),
    sql` `,
  );
  // expenses.expenseDate / otherIncome.incomeDate are plain DATE columns —
  // bucketed against calendar-day strings, same convention toDateStr()
  // documents at the top of this file and getExpenseSummary/
  // getOtherIncomeTotalCents already use.
  const expenseBucket = sql.join(
    targets.map((t, i) => sql`when ${expenses.expenseDate} >= ${toDateStr(t.start)} and ${expenses.expenseDate} < ${toDateStr(t.end)} then ${i}`),
    sql` `,
  );
  const incomeBucket = sql.join(
    targets.map((t, i) => sql`when ${otherIncome.incomeDate} >= ${toDateStr(t.start)} and ${otherIncome.incomeDate} < ${toDateStr(t.end)} then ${i}`),
    sql` `,
  );
  const salesIdx = sql<number>`case ${salesBucket} end`;
  const expenseIdx = sql<number>`case ${expenseBucket} end`;
  const incomeIdx = sql<number>`case ${incomeBucket} end`;

  // Grouped by ordinal position (`1`), not by repeating the CASE expression
  // — Postgres validates a non-aggregated SELECT column against GROUP BY by
  // comparing parse trees, and Drizzle re-serializes each occurrence of the
  // same `sql` fragment with its own fresh bind parameters, which Postgres
  // doesn't reliably recognise as "the same expression" even when the
  // values are identical (this failed with exactly that error on first
  // attempt for the expenses query). `GROUP BY 1` sidesteps the whole
  // question — it's unambiguous regardless of how the expression itself is
  // parameterized.
  const [revenueRows, cogsRows, expenseRows, incomeRows] = await Promise.all([
    db
      .select({ idx: salesIdx, total: sql<string>`coalesce(sum(${sales.totalCents}), 0)` })
      .from(sales)
      .where(and(sql`${sales.status} != 'cancelled'`, gte(sales.occurredAt, overallStart), lt(sales.occurredAt, overallEnd)))
      .groupBy(sql`1`),
    db
      .select({ idx: salesIdx, total: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)` })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(and(sql`${sales.status} != 'cancelled'`, gte(sales.occurredAt, overallStart), lt(sales.occurredAt, overallEnd)))
      .groupBy(sql`1`),
    db
      .select({ idx: expenseIdx, total: sql<string>`coalesce(sum(${expenses.amountCents}), 0)` })
      .from(expenses)
      .where(and(eq(expenses.status, "recorded"), eq(expenses.treatment, "operating"), gte(expenses.expenseDate, overallStartStr), lt(expenses.expenseDate, overallEndStr)))
      .groupBy(sql`1`),
    db
      .select({ idx: incomeIdx, total: sql<string>`coalesce(sum(${otherIncome.amountCents}), 0)` })
      .from(otherIncome)
      .where(and(eq(otherIncome.status, "recorded"), gte(otherIncome.incomeDate, overallStartStr), lt(otherIncome.incomeDate, overallEndStr)))
      .groupBy(sql`1`),
  ]);

  // Number(r.idx) — the CASE branch's integer literal comes back from
  // postgres.js as a string despite the sql<number> annotation (its
  // resulting type OID is ambiguous to the driver), so comparing it
  // against the plain JS number `i` below without coercion silently missed
  // on every lookup — caught by cross-checking this against the old
  // per-month implementation on local data before this was ever committed.
  const toMap = (rows: { idx: number; total: string }[]) => new Map(rows.map((r) => [Number(r.idx), Number(r.total)]));
  const revenueMap = toMap(revenueRows);
  const cogsMap = toMap(cogsRows);
  const expenseMap = toMap(expenseRows);
  const incomeMap = toMap(incomeRows);

  return targets.map((t, i) => {
    const netSalesRevenueCents = revenueMap.get(i) ?? 0;
    const cogsCents = cogsMap.get(i) ?? 0;
    const grossProfitCents = netSalesRevenueCents - cogsCents;
    const operatingExpensesCents = expenseMap.get(i) ?? 0;
    const otherIncomeCents = incomeMap.get(i) ?? 0;
    const netProfitCents = grossProfitCents - operatingExpensesCents + otherIncomeCents;
    return {
      year: t.year,
      month: t.month,
      label: `${MONTH_NAMES[t.month - 1]} ${t.year}`,
      netSalesRevenueCents,
      cogsCents,
      grossProfitCents,
      operatingExpensesCents,
      otherIncomeCents,
      netProfitCents,
    };
  });
}

// -- period comparison (Phase 8 §3/§12/§54) ----------------------------------

export interface ComparisonFigure {
  current: number;
  previous: number;
  changeCents: number;
  /** null when previous is zero/negative or there's no previous period
   * (All time) — see safePctChange. Never Infinity/NaN. */
  changePct: number | null;
}

export interface PeriodComparison {
  hasPrevious: boolean;
  revenue: ComparisonFigure;
  cogs: ComparisonFigure;
  grossProfit: ComparisonFigure;
  operatingExpenses: ComparisonFigure;
  netProfit: ComparisonFigure;
}

function figure(current: number, previous: number): ComparisonFigure {
  return { current, previous, changeCents: current - previous, changePct: safePctChange(current, previous) };
}

/** Current period vs the immediately preceding period of the same length
 * (September vs August, Q3 vs Q2, this year vs last year — Phase 8 §12).
 * Built entirely on getFinancialSummary, the same function Dashboard and
 * Financials already call, so a comparison card can never disagree with
 * either about what "this period's revenue" means. All time (dateFrom/
 * dateTo both null) has no previous period by definition — hasPrevious is
 * false and every previous figure is 0 with changePct null, never a
 * fabricated comparison. */
// Accepts an already-fetched `current` summary — a caller that also needs
// the full FinancialSummary for its own P&L card (the Dashboard, most
// notably) would otherwise trigger getFinancialSummary twice for the same
// period (itself ~10 DB round trips), stacking connection load right back
// onto the page the earlier 504 fix was specifically about. Reports/
// financial doesn't have its own copy handy, so it omits this and gets the
// original one-call-does-everything behaviour.
export async function getPeriodComparison(filters: FinancialsFilters, current?: FinancialSummary): Promise<PeriodComparison> {
  const [prevFrom, prevTo] = previousPeriod(filters.dateFrom ?? null, filters.dateTo ?? null);
  const hasPrevious = prevFrom !== null && prevTo !== null;

  const [currentSummary, previous] = await Promise.all([
    current ? Promise.resolve(current) : getFinancialSummary(filters),
    hasPrevious ? getFinancialSummary({ dateFrom: prevFrom, dateTo: prevTo }) : Promise.resolve(null),
  ]);

  const zero = { netSalesRevenueCents: 0, cogsCents: 0, grossProfitCents: 0, operatingExpensesCents: 0, netProfitCents: 0 };
  const p = previous ?? zero;

  return {
    hasPrevious,
    revenue: figure(currentSummary.netSalesRevenueCents, p.netSalesRevenueCents),
    cogs: figure(currentSummary.cogsCents, p.cogsCents),
    grossProfit: figure(currentSummary.grossProfitCents, p.grossProfitCents),
    operatingExpenses: figure(currentSummary.operatingExpensesCents, p.operatingExpensesCents),
    netProfit: figure(currentSummary.netProfitCents, p.netProfitCents),
  };
}

/** Monthly Financial Performance export (Phase 8 §41) — same rows
 * getMonthlyTrend returns, so the export always matches what the Reports
 * page shows. monthsBack, not a date range, since this report is inherently
 * a fixed trailing window rather than an arbitrary [from, to). */
export async function exportMonthlyTrendCsv(monthsBack = 12): Promise<string> {
  const rows = await getMonthlyTrend(monthsBack);
  return toCsv(
    ["Month", "Net revenue (cents)", "COGS (cents)", "Gross profit (cents)", "Operating expenses (cents)", "Other income (cents)", "Net profit (cents)"],
    rows.map((r) => [r.label, r.netSalesRevenueCents, r.cogsCents, r.grossProfitCents, r.operatingExpensesCents, r.otherIncomeCents, r.netProfitCents]),
  );
}
