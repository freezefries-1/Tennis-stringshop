import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sales, saleItems } from "@/db/schema";
import { getSalesSummary, type SalesFilters } from "./sales";
import { getExpenseSummary, type ExpenseCategoryAmount } from "./expenses";
import { getOtherIncomeTotalCents } from "./other-income";

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

/** Oldest first, ending at (and including) the given year/month —
 * defaults to the current calendar month. Six months by default, matching
 * the brief's own Apr-Sep example; kept as a supporting view only, not
 * the full Phase 8 trend/analytics dashboard. */
export async function getMonthlyTrend(monthsBack = 6, endYear?: number, endMonth?: number): Promise<MonthlyFinancials[]> {
  const now = new Date();
  const anchorYear = endYear ?? now.getFullYear();
  const anchorMonth = endMonth ?? now.getMonth() + 1;

  const targets: { year: number; month: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(anchorYear, anchorMonth - 1 - i, 1);
    targets.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return Promise.all(targets.map((t) => getMonthlyFinancials(t.year, t.month)));
}
