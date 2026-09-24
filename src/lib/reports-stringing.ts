// Phase 8 — Reports → Stringing. Job counts and physical usage come from
// String Jobs / string_job_strings; every dollar figure (revenue/COGS/gross
// profit) comes from Sales/Sale Items via getSalesSplit — the same function
// /financials and the Dashboard already use — so this report can never
// independently drift from what those pages show for the same period.
// String Job final_price_cents is NEVER summed as revenue anywhere here.

import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sales, saleItems, stringJobs, stringJobStrings, stringProducts, stringInventoryBatches } from "@/db/schema";
import { getSalesSplit, type FinancialsFilters } from "./financials";
import { toCsv } from "./csv";

// -- overview -----------------------------------------------------------

export interface StringingOverview {
  jobCount: number;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  avgRevenuePerJobCents: number | null;
  avgGrossProfitPerJobCents: number | null;
}

/** Just the count — for the Dashboard's "String jobs this period" card,
 * which doesn't need the dollar figures (and therefore not getSalesSplit)
 * that the full getStringingOverview below also computes. Kept as its own
 * single-query function so the Dashboard isn't paying for a second
 * getSalesSplit call it has no other use for. */
export async function getStringJobCountForPeriod(filters: FinancialsFilters): Promise<number> {
  const conditions = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) conditions.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(stringJobs.completedAt, filters.dateTo));
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(stringJobs).where(and(...conditions));
  return row?.count ?? 0;
}

/** jobCount is filtered by completedAt (a job only has a revenue figure
 * once completed and billed via its linked Sale, created the same moment —
 * see createJobSale in sales.ts), matching the window getSalesSplit filters
 * Sales by (occurredAt) — the two naturally line up since a job's Sale is
 * created at completion time. Cancelled jobs never count (Phase 6/7
 * convention used everywhere else in this app). */
export async function getStringingOverview(filters: FinancialsFilters): Promise<StringingOverview> {
  const conditions = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) conditions.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(stringJobs.completedAt, filters.dateTo));

  const [[countRow], split] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(stringJobs).where(and(...conditions)),
    getSalesSplit(filters),
  ]);

  const jobCount = countRow?.count ?? 0;
  const revenueCents = split.stringing.revenueCents;
  const cogsCents = split.stringing.cogsCents;
  const grossProfitCents = split.stringing.grossProfitCents;

  return {
    jobCount,
    revenueCents,
    cogsCents,
    grossProfitCents,
    avgRevenuePerJobCents: jobCount > 0 ? Math.round(revenueCents / jobCount) : null,
    avgGrossProfitPerJobCents: jobCount > 0 ? Math.round(grossProfitCents / jobCount) : null,
  };
}

// -- string usage ---------------------------------------------------------

export interface StringUsageRow {
  stringProductId: string;
  brand: string;
  name: string;
  gauge: string | null;
  colour: string | null;
  jobs: number;
  /** Sum of quantityUsed where usageUnit = 'm' only — a set-tracked string's
   * usage isn't a length, so it's never added into this figure (kept
   * separate by trackingUnit instead of silently mixing units). Labeled
   * "Estimated" throughout the UI per Phase 8 §15/§45: it's the quantity
   * recorded on the job at save time, not a physical remeasurement. */
  estimatedMetresConsumed: number;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  currentStock: string;
  trackingUnit: "m" | "set";
  inventoryValueCents: number;
}

/** One row per string PRODUCT (brand+name+gauge+colour) — variants stay
 * distinguishable (Phase 8 §15's "Hyper-G 1.20 vs Hyper-G 1.25" example),
 * never merged by name alone. Current stock/inventory value are point-in-
 * time NOW figures (remaining batch quantity × actual cost basis, FIFO —
 * never selling price), not scoped to the date filter; jobs/metres/revenue/
 * COGS/gross-profit ARE scoped to it. */
export async function listStringUsage(filters: FinancialsFilters): Promise<StringUsageRow[]> {
  const jobConditions = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) jobConditions.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) jobConditions.push(lt(stringJobs.completedAt, filters.dateTo));

  const saleConditions = [sql`${sales.status} != 'cancelled'`, eq(saleItems.itemType, "string_job_service")];
  if (filters.dateFrom) saleConditions.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) saleConditions.push(lt(sales.occurredAt, filters.dateTo));

  const [usageRows, financeRows, stockRows] = await Promise.all([
    db
      .select({
        stringProductId: stringJobStrings.stringProductId,
        jobs: sql<number>`count(distinct ${stringJobStrings.stringJobId})::int`,
        metres: sql<string>`coalesce(sum(${stringJobStrings.quantityUsed}) filter (where ${stringJobStrings.usageUnit} = 'm'), 0)`,
      })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .where(and(sql`${stringJobStrings.stringProductId} is not null`, ...jobConditions))
      .groupBy(stringJobStrings.stringProductId),
    db
      .select({
        stringProductId: saleItems.stringProductId,
        revenue: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)`,
        cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(and(sql`${saleItems.stringProductId} is not null`, ...saleConditions))
      .groupBy(saleItems.stringProductId),
    db
      .select({
        id: stringProducts.id,
        brand: stringProducts.brand,
        name: stringProducts.name,
        gauge: stringProducts.gauge,
        colour: stringProducts.colour,
        trackingUnit: stringProducts.trackingUnit,
        currentStock: sql<string>`coalesce(sum(${stringInventoryBatches.remainingQuantity}) filter (where ${stringInventoryBatches.remainingQuantity} > 0), 0)`,
        // Actual remaining batch cost basis (FIFO), never selling price —
        // Phase 8 §28.
        inventoryValue: sql<string>`coalesce(sum(${stringInventoryBatches.remainingQuantity} * ${stringInventoryBatches.costPerUnitCents}) filter (where ${stringInventoryBatches.remainingQuantity} > 0), 0)`,
      })
      .from(stringProducts)
      .leftJoin(stringInventoryBatches, eq(stringInventoryBatches.stringProductId, stringProducts.id))
      .groupBy(stringProducts.id, stringProducts.brand, stringProducts.name, stringProducts.gauge, stringProducts.colour, stringProducts.trackingUnit),
  ]);

  const usageMap = new Map(usageRows.map((r) => [r.stringProductId, r]));
  const financeMap = new Map(financeRows.map((r) => [r.stringProductId, r]));

  return stockRows
    .map((s) => {
      const usage = usageMap.get(s.id);
      const finance = financeMap.get(s.id);
      return {
        stringProductId: s.id,
        brand: s.brand,
        name: s.name,
        gauge: s.gauge,
        colour: s.colour,
        jobs: usage?.jobs ?? 0,
        estimatedMetresConsumed: Number(usage?.metres ?? 0),
        revenueCents: Number(finance?.revenue ?? 0),
        cogsCents: Number(finance?.cogs ?? 0),
        grossProfitCents: Number(finance?.revenue ?? 0) - Number(finance?.cogs ?? 0),
        currentStock: Number(s.currentStock).toFixed(2),
        trackingUnit: s.trackingUnit,
        // True integer cents, no /100 — see the matching comment in
        // reports-products.ts's getProductAnalytics for why.
        inventoryValueCents: Math.round(Number(s.inventoryValue)),
      };
    })
    .filter((r) => r.jobs > 0 || r.revenueCents !== 0 || Number(r.currentStock) > 0);
}

// -- brand analysis ---------------------------------------------------------

export interface StringBrandRow {
  brand: string;
  jobs: number;
  estimatedMetresConsumed: number;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
}

export async function listStringBrandAnalysis(filters: FinancialsFilters): Promise<StringBrandRow[]> {
  const jobConditions = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) jobConditions.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) jobConditions.push(lt(stringJobs.completedAt, filters.dateTo));

  const saleConditions = [sql`${sales.status} != 'cancelled'`, eq(saleItems.itemType, "string_job_service")];
  if (filters.dateFrom) saleConditions.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) saleConditions.push(lt(sales.occurredAt, filters.dateTo));

  const [usageRows, financeRows] = await Promise.all([
    db
      .select({
        brand: stringProducts.brand,
        jobs: sql<number>`count(distinct ${stringJobStrings.stringJobId})::int`,
        metres: sql<string>`coalesce(sum(${stringJobStrings.quantityUsed}) filter (where ${stringJobStrings.usageUnit} = 'm'), 0)`,
      })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .innerJoin(stringProducts, eq(stringProducts.id, stringJobStrings.stringProductId))
      .where(and(...jobConditions))
      .groupBy(stringProducts.brand),
    db
      .select({
        brand: stringProducts.brand,
        revenue: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)`,
        cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)`,
      })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .innerJoin(stringProducts, eq(stringProducts.id, saleItems.stringProductId))
      .where(and(...saleConditions))
      .groupBy(stringProducts.brand),
  ]);

  const financeMap = new Map(financeRows.map((r) => [r.brand, r]));
  const brands = new Set([...usageRows.map((r) => r.brand), ...financeRows.map((r) => r.brand)]);

  return [...brands]
    .map((brand) => {
      const usage = usageRows.find((r) => r.brand === brand);
      const finance = financeMap.get(brand);
      const revenueCents = Number(finance?.revenue ?? 0);
      const cogsCents = Number(finance?.cogs ?? 0);
      return { brand, jobs: usage?.jobs ?? 0, estimatedMetresConsumed: Number(usage?.metres ?? 0), revenueCents, cogsCents, grossProfitCents: revenueCents - cogsCents };
    })
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

// -- setup analytics ---------------------------------------------------------

export interface TensionModeRow {
  tension: string;
  unit: "kg" | "lb";
  count: number;
}

export interface StringSetupAnalytics {
  sampleSizeJobs: number;
  sampleSizeLines: number;
  mostCommonTensions: TensionModeRow[];
  /** Averaged separately per unit — kg and lb tensions are never silently
   * converted/mixed into one number (Phase 8 §17/§46: don't overinterpret,
   * show sample size). */
  avgMainTension: { unit: "kg" | "lb"; avg: number; n: number }[];
  avgCrossTension: { unit: "kg" | "lb"; avg: number; n: number }[];
  mostCommonKnotCount: { knots: number; count: number }[];
  setupTypeSplit: { setupType: "full" | "hybrid"; count: number }[];
  customerSuppliedSplit: { customerSupplied: boolean; count: number }[];
}

export async function getStringSetupAnalytics(filters: FinancialsFilters): Promise<StringSetupAnalytics> {
  const jobConditions = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) jobConditions.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) jobConditions.push(lt(stringJobs.completedAt, filters.dateTo));

  const [[jobCountRow], tensionRows, mainAvgRows, crossAvgRows, knotRows, setupRows, suppliedRows, [lineCountRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(stringJobs).where(and(...jobConditions)),
    db
      .select({ tension: stringJobStrings.tension, unit: stringJobStrings.tensionUnit, count: sql<number>`count(*)::int` })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .where(and(...jobConditions))
      .groupBy(stringJobStrings.tension, stringJobStrings.tensionUnit)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
    db
      .select({ unit: stringJobStrings.tensionUnit, avg: sql<string>`avg(${stringJobStrings.tension})`, n: sql<number>`count(*)::int` })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .where(and(eq(stringJobStrings.role, "main"), ...jobConditions))
      .groupBy(stringJobStrings.tensionUnit),
    db
      .select({ unit: stringJobStrings.tensionUnit, avg: sql<string>`avg(${stringJobStrings.tension})`, n: sql<number>`count(*)::int` })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .where(and(eq(stringJobStrings.role, "cross"), ...jobConditions))
      .groupBy(stringJobStrings.tensionUnit),
    db
      .select({ knots: stringJobs.numberOfKnots, count: sql<number>`count(*)::int` })
      .from(stringJobs)
      .where(and(sql`${stringJobs.numberOfKnots} is not null`, ...jobConditions))
      .groupBy(stringJobs.numberOfKnots)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({ setupType: stringJobs.setupType, count: sql<number>`count(*)::int` })
      .from(stringJobs)
      .where(and(...jobConditions))
      .groupBy(stringJobs.setupType),
    db
      .select({ customerSupplied: stringJobStrings.customerSupplied, count: sql<number>`count(*)::int` })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .where(and(...jobConditions))
      .groupBy(stringJobStrings.customerSupplied),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stringJobStrings)
      .innerJoin(stringJobs, eq(stringJobs.id, stringJobStrings.stringJobId))
      .where(and(...jobConditions)),
  ]);

  return {
    sampleSizeJobs: jobCountRow?.count ?? 0,
    sampleSizeLines: lineCountRow?.count ?? 0,
    mostCommonTensions: tensionRows.map((r) => ({ tension: r.tension, unit: r.unit, count: r.count })),
    avgMainTension: mainAvgRows.map((r) => ({ unit: r.unit, avg: Math.round(Number(r.avg) * 100) / 100, n: r.n })),
    avgCrossTension: crossAvgRows.map((r) => ({ unit: r.unit, avg: Math.round(Number(r.avg) * 100) / 100, n: r.n })),
    mostCommonKnotCount: knotRows.map((r) => ({ knots: r.knots as number, count: r.count })),
    setupTypeSplit: setupRows.map((r) => ({ setupType: r.setupType, count: r.count })),
    customerSuppliedSplit: suppliedRows.map((r) => ({ customerSupplied: r.customerSupplied, count: r.count })),
  };
}

// -- monthly job-count trend (Dashboard's "String Jobs Trend" chart) --------

export interface StringJobsTrendRow {
  year: number;
  month: number;
  label: string;
  jobCount: number;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** One grouped query (a month-bucket CASE, same technique as
 * getMonthlyTrend in financials.ts), not one query per month — kept cheap
 * enough to sit on the Dashboard without adding meaningfully to its
 * connection count. */
export async function getStringJobsTrend(monthsBack = 6): Promise<StringJobsTrendRow[]> {
  const now = new Date();
  const targets: { year: number; month: number; start: Date; end: Date }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    targets.push({ year: d.getFullYear(), month: d.getMonth() + 1, start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) });
  }
  const overallStart = targets[0].start;
  const overallEnd = targets[targets.length - 1].end;

  const bucketCase = sql.join(
    targets.map((t, i) => sql`when ${stringJobs.completedAt} >= ${t.start.toISOString()} and ${stringJobs.completedAt} < ${t.end.toISOString()} then ${i}`),
    sql` `,
  );
  const idxExpr = sql<number>`case ${bucketCase} end`;

  const rows = await db
    .select({ idx: idxExpr, count: sql<number>`count(*)::int` })
    .from(stringJobs)
    .where(and(inArray(stringJobs.status, ["completed", "collected"]), gte(stringJobs.completedAt, overallStart), lt(stringJobs.completedAt, overallEnd)))
    .groupBy(sql`1`);

  const map = new Map(rows.map((r) => [Number(r.idx), r.count]));
  return targets.map((t, i) => ({ year: t.year, month: t.month, label: `${MONTH_NAMES[t.month - 1].slice(0, 3)} ${t.year}`, jobCount: map.get(i) ?? 0 }));
}

/** String Usage export (Phase 8 §41) — respects the same filters the
 * Reports page's own date range applies. */
export async function exportStringUsageCsv(filters: FinancialsFilters): Promise<string> {
  const rows = await listStringUsage(filters);
  return toCsv(
    ["Brand", "String", "Gauge", "Colour", "Jobs", "Est. metres used", "Revenue (cents)", "COGS (cents)", "Gross profit (cents)", "Current stock", "Unit", "Inventory value (cents)"],
    rows.map((r) => [r.brand, r.name, r.gauge, r.colour, r.jobs, r.estimatedMetresConsumed, r.revenueCents, r.cogsCents, r.grossProfitCents, r.currentStock, r.trackingUnit, r.inventoryValueCents]),
  );
}
