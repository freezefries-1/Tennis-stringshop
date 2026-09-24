// Phase 8 — Reports → Stringing (racket breakdowns) and the restring-
// frequency / potentially-due reports. Built on Customer Rackets + the
// Master Racket Database + String Jobs, per the brief. Manual/unlinked
// rackets (racketModelId null) fall back to their own free-text brand/
// series/model columns via COALESCE, so an "Unknown"-catalogue racket still
// shows up under whatever the stringer actually typed, rather than
// disappearing from these reports.

import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, racketBrands, racketModels, racketSeries, stringJobs } from "@/db/schema";
import type { FinancialsFilters } from "./financials";

const effectiveBrand = sql<string>`coalesce(${racketBrands.name}, ${customerRackets.brand}, 'Unknown')`;
const effectiveSeries = sql<string>`coalesce(${racketSeries.name}, ${customerRackets.series}, '')`;
const effectiveModel = sql<string>`coalesce(${racketModels.model}, ${customerRackets.model}, 'Unknown')`;
const effectiveGenYear = sql<number | null>`coalesce(${racketModels.generationYear}, ${customerRackets.generationYear})`;
const effectiveGenName = sql<string | null>`${racketModels.generationName}`;

function jobConditions(filters: FinancialsFilters) {
  const conditions = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) conditions.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(stringJobs.completedAt, filters.dateTo));
  return conditions;
}

export interface RacketBrandRow {
  brand: string;
  jobs: number;
  rackets: number;
}

export async function listRacketBrandCounts(filters: FinancialsFilters): Promise<RacketBrandRow[]> {
  const rows = await db
    .select({ brand: effectiveBrand, jobs: sql<number>`count(*)::int`, rackets: sql<number>`count(distinct ${stringJobs.customerRacketId})::int` })
    .from(stringJobs)
    .innerJoin(customerRackets, eq(customerRackets.id, stringJobs.customerRacketId))
    .leftJoin(racketModels, eq(racketModels.id, customerRackets.racketModelId))
    .leftJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .leftJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(and(...jobConditions(filters)))
    .groupBy(effectiveBrand)
    .orderBy(sql`count(*) desc`);
  return rows;
}

export interface RacketSeriesRow {
  brand: string;
  series: string;
  jobs: number;
  rackets: number;
}

export async function listRacketSeriesCounts(filters: FinancialsFilters): Promise<RacketSeriesRow[]> {
  const rows = await db
    .select({ brand: effectiveBrand, series: effectiveSeries, jobs: sql<number>`count(*)::int`, rackets: sql<number>`count(distinct ${stringJobs.customerRacketId})::int` })
    .from(stringJobs)
    .innerJoin(customerRackets, eq(customerRackets.id, stringJobs.customerRacketId))
    .leftJoin(racketModels, eq(racketModels.id, customerRackets.racketModelId))
    .leftJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .leftJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(and(...jobConditions(filters)))
    .groupBy(effectiveBrand, effectiveSeries)
    .orderBy(sql`count(*) desc`);
  return rows.filter((r) => r.series !== "");
}

export interface RacketModelRow {
  brand: string;
  series: string;
  model: string;
  generationYear: number | null;
  generationName: string | null;
  jobs: number;
  rackets: number;
}

/** Grouped by brand+series+model+generation — Phase 8 §18's "EZONE 100
 * 2025 must be identifiable separately from older generations" requirement,
 * so two generations of the same model are always two rows here, never
 * merged into one "EZONE 100" count. */
export async function listRacketModelCounts(filters: FinancialsFilters): Promise<RacketModelRow[]> {
  const rows = await db
    .select({
      brand: effectiveBrand,
      series: effectiveSeries,
      model: effectiveModel,
      generationYear: effectiveGenYear,
      generationName: effectiveGenName,
      jobs: sql<number>`count(*)::int`,
      rackets: sql<number>`count(distinct ${stringJobs.customerRacketId})::int`,
    })
    .from(stringJobs)
    .innerJoin(customerRackets, eq(customerRackets.id, stringJobs.customerRacketId))
    .leftJoin(racketModels, eq(racketModels.id, customerRackets.racketModelId))
    .leftJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .leftJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(and(...jobConditions(filters)))
    .groupBy(effectiveBrand, effectiveSeries, effectiveModel, effectiveGenYear, effectiveGenName)
    .orderBy(sql`count(*) desc`);
  return rows;
}

// -- restring frequency (Phase 8 §20/§21/§51) --------------------------------
//
// Always all-time, never scoped to the Reports page's own date filter — an
// interval calculation needs a racket's FULL stringing history regardless
// of which period happens to be selected, same reasoning as the unbounded
// customer purchase/stringing history tabs elsewhere in this app.

export interface RestringFrequencyRow {
  customerRacketId: string;
  racketCode: string;
  racketLabel: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  jobCount: number;
  intervalCount: number;
  avgDays: number | null;
  medianDays: number | null;
  daysSinceLastStringing: number;
  lastStringingDate: Date;
}

function median(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** One row per physical racket with at least 2 completed (non-cancelled)
 * String Jobs — a racket with 0 or 1 completed job has no interval to
 * report at all and is simply absent, never shown with a fabricated
 * "average" of one data point. Intervals are computed with a single SQL
 * window function (LAG over completedAt, partitioned per racket) rather
 * than looping per racket in application code — one query regardless of
 * how many rackets exist. */
export async function getRestringFrequency(): Promise<RestringFrequencyRow[]> {
  const intervalRows = await db.execute<{ customer_racket_id: string; completed_at: Date; interval_days: number | null }>(sql`
    select customer_racket_id, completed_at,
      extract(epoch from (completed_at - lag(completed_at) over (partition by customer_racket_id order by completed_at))) / 86400 as interval_days
    from ${stringJobs}
    where status in ('completed', 'collected') and completed_at is not null
  `);

  const byRacket = new Map<string, { completedDates: Date[]; intervals: number[] }>();
  for (const row of intervalRows) {
    const entry = byRacket.get(row.customer_racket_id) ?? { completedDates: [], intervals: [] };
    entry.completedDates.push(new Date(row.completed_at));
    if (row.interval_days != null) entry.intervals.push(Number(row.interval_days));
    byRacket.set(row.customer_racket_id, entry);
  }

  const racketIds = [...byRacket.entries()].filter(([, v]) => v.intervals.length > 0).map(([id]) => id);
  if (racketIds.length === 0) return [];

  const racketRows = await db
    .select({ racket: customerRackets, customerId: customers.id, customerCode: customers.code, customerName: customers.name })
    .from(customerRackets)
    .innerJoin(customers, eq(customers.id, customerRackets.customerId))
    .where(inArray(customerRackets.id, racketIds));

  const now = Date.now();
  const results: RestringFrequencyRow[] = [];
  for (const r of racketRows) {
    const entry = byRacket.get(r.racket.id);
    if (!entry) continue;
    const sortedIntervals = [...entry.intervals].sort((a, b) => a - b);
    const avgDays = sortedIntervals.reduce((s, v) => s + v, 0) / sortedIntervals.length;
    const lastDate = entry.completedDates[entry.completedDates.length - 1];
    results.push({
      customerRacketId: r.racket.id,
      racketCode: r.racket.code,
      racketLabel: r.racket.nickname || r.racket.code,
      customerId: r.customerId,
      customerCode: r.customerCode,
      customerName: r.customerName,
      jobCount: entry.completedDates.length,
      intervalCount: sortedIntervals.length,
      avgDays: Math.round(avgDays),
      medianDays: Math.round(median(sortedIntervals)),
      daysSinceLastStringing: Math.floor((now - lastDate.getTime()) / 86400000),
      lastStringingDate: lastDate,
    });
  }
  return results.sort((a, b) => b.daysSinceLastStringing - a.daysSinceLastStringing);
}

export interface PotentiallyDueRow extends RestringFrequencyRow {
  overdueByDays: number;
}

/** "Potentially due" = days since last stringing has already passed this
 * racket's own average interval — a pattern-based signal, never a claim of
 * certainty (Phase 8 §21: label as "Potentially due" / "Based on previous
 * restring pattern", never send anything automatically). Rackets with
 * fewer than 2 completed jobs never appear (getRestringFrequency already
 * excludes them — insufficient history). */
export async function getPotentiallyDueForRestring(): Promise<PotentiallyDueRow[]> {
  const all = await getRestringFrequency();
  return all
    .filter((r) => r.avgDays !== null && r.daysSinceLastStringing >= r.avgDays)
    .map((r) => ({ ...r, overdueByDays: r.daysSinceLastStringing - (r.avgDays ?? 0) }))
    .sort((a, b) => b.overdueByDays - a.overdueByDays);
}
