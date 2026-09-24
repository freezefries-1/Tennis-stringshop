// Phase 8 — Reports → Customers.
//
// New vs Returning definition (Phase 8 §26 — documented here, the one place
// this decision is made):
//   New customer: their first-ever qualifying activity (a non-cancelled
//   Sale, or a completed/collected String Job) falls inside the selected
//   period.
//   Returning customer: they had qualifying activity BEFORE the selected
//   period AND again during it.
// "All time" (no date filter) has no well-defined New/Returning split — every
// customer's first activity is trivially "in" an unbounded period, so both
// figures are reported as null rather than a number that means nothing.

import { and, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customers, sales, stringJobs } from "@/db/schema";
import type { FinancialsFilters } from "./financials";
import { toCsv } from "./csv";

export interface CustomerAnalyticsSummary {
  totalCustomers: number;
  /** null when filters are All time (no period to be "new" within). */
  newCustomers: number | null;
  returningCustomers: number | null;
  customersWithPurchases: number;
  customersWithStringJobs: number;
  avgCustomerSpendCents: number | null;
  avgTransactionsPerCustomer: number | null;
}

export async function getCustomerAnalyticsSummary(filters: FinancialsFilters): Promise<CustomerAnalyticsSummary> {
  const saleDateConds = (from?: Date | null, to?: Date | null) => {
    const c = [sql`${sales.status} != 'cancelled'`, sql`${sales.customerId} is not null`];
    if (from) c.push(gte(sales.occurredAt, from));
    if (to) c.push(lt(sales.occurredAt, to));
    return c;
  };
  const jobDateConds = (from?: Date | null, to?: Date | null) => {
    const c = [inArray(stringJobs.status, ["completed", "collected"])];
    if (from) c.push(gte(stringJobs.completedAt, from));
    if (to) c.push(lt(stringJobs.completedAt, to));
    return c;
  };

  const [[totalRow], periodSaleCustomers, periodJobCustomers, periodSaleStats, firstSaleRows, firstJobRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(customers).where(isNull(customers.archivedAt)),
    db.select({ customerId: sales.customerId }).from(sales).where(and(...saleDateConds(filters.dateFrom, filters.dateTo))).groupBy(sales.customerId),
    db.select({ customerId: stringJobs.customerId }).from(stringJobs).where(and(...jobDateConds(filters.dateFrom, filters.dateTo))).groupBy(stringJobs.customerId),
    db
      .select({ customerId: sales.customerId, total: sql<string>`sum(${sales.totalCents})`, count: sql<number>`count(*)::int` })
      .from(sales)
      .where(and(...saleDateConds(filters.dateFrom, filters.dateTo)))
      .groupBy(sales.customerId),
    db.select({ customerId: sales.customerId, first: sql<Date>`min(${sales.occurredAt})` }).from(sales).where(and(...saleDateConds(null, null))).groupBy(sales.customerId),
    db.select({ customerId: stringJobs.customerId, first: sql<Date>`min(${stringJobs.completedAt})` }).from(stringJobs).where(and(...jobDateConds(null, null))).groupBy(stringJobs.customerId),
  ]);

  const purchaserIds = new Set(periodSaleCustomers.map((r) => r.customerId as string));
  const jobCustomerIds = new Set(periodJobCustomers.map((r) => r.customerId));
  const activeInPeriod = new Set([...purchaserIds, ...jobCustomerIds]);

  const totalSpendCents = periodSaleStats.reduce((sum, r) => sum + Number(r.total), 0);
  const totalTransactions = periodSaleStats.reduce((sum, r) => sum + r.count, 0);

  let newCustomers: number | null = null;
  let returningCustomers: number | null = null;
  if (filters.dateFrom && filters.dateTo) {
    const firstActivity = new Map<string, Date>();
    for (const r of firstSaleRows) {
      if (!r.customerId) continue;
      const existing = firstActivity.get(r.customerId);
      if (!existing || new Date(r.first) < existing) firstActivity.set(r.customerId, new Date(r.first));
    }
    for (const r of firstJobRows) {
      const existing = firstActivity.get(r.customerId);
      if (!existing || new Date(r.first) < existing) firstActivity.set(r.customerId, new Date(r.first));
    }
    let newCount = 0;
    let returningCount = 0;
    for (const custId of activeInPeriod) {
      const first = firstActivity.get(custId);
      if (!first) continue;
      if (first >= filters.dateFrom && first < filters.dateTo) newCount++;
      else if (first < filters.dateFrom) returningCount++;
    }
    newCustomers = newCount;
    returningCustomers = returningCount;
  }

  return {
    totalCustomers: totalRow?.count ?? 0,
    newCustomers,
    returningCustomers,
    customersWithPurchases: purchaserIds.size,
    customersWithStringJobs: jobCustomerIds.size,
    avgCustomerSpendCents: purchaserIds.size > 0 ? Math.round(totalSpendCents / purchaserIds.size) : null,
    avgTransactionsPerCustomer: purchaserIds.size > 0 ? totalTransactions / purchaserIds.size : null,
  };
}

export interface CustomerPerformanceRow {
  customerId: string;
  code: string;
  name: string;
  /** Sales total/count are scoped to the selected period; last purchase/
   * last string job are all-time (answers "when did we last see them",
   * regardless of the current filter — same convention as the customer
   * profile's own lastVisit). */
  totalSalesCents: number;
  numberOfSales: number;
  stringJobsInPeriod: number;
  avgSaleValueCents: number | null;
  lastPurchase: Date | null;
  lastStringJob: Date | null;
}

export async function listCustomerPerformance(filters: FinancialsFilters): Promise<CustomerPerformanceRow[]> {
  const saleDateConds = [sql`${sales.status} != 'cancelled'`, sql`${sales.customerId} is not null`];
  if (filters.dateFrom) saleDateConds.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) saleDateConds.push(lt(sales.occurredAt, filters.dateTo));
  const jobDateConds = [inArray(stringJobs.status, ["completed", "collected"])];
  if (filters.dateFrom) jobDateConds.push(gte(stringJobs.completedAt, filters.dateFrom));
  if (filters.dateTo) jobDateConds.push(lt(stringJobs.completedAt, filters.dateTo));

  const [customerRows, periodSaleRows, periodJobRows, lastPurchaseRows, lastJobRows] = await Promise.all([
    db.select({ id: customers.id, code: customers.code, name: customers.name }).from(customers).where(isNull(customers.archivedAt)),
    db
      .select({ customerId: sales.customerId, total: sql<string>`sum(${sales.totalCents})`, count: sql<number>`count(*)::int` })
      .from(sales)
      .where(and(...saleDateConds))
      .groupBy(sales.customerId),
    db.select({ customerId: stringJobs.customerId, count: sql<number>`count(*)::int` }).from(stringJobs).where(and(...jobDateConds)).groupBy(stringJobs.customerId),
    db.select({ customerId: sales.customerId, last: sql<Date>`max(${sales.occurredAt})` }).from(sales).where(and(sql`${sales.status} != 'cancelled'`, sql`${sales.customerId} is not null`)).groupBy(sales.customerId),
    db.select({ customerId: stringJobs.customerId, last: sql<Date>`max(${stringJobs.completedAt})` }).from(stringJobs).where(inArray(stringJobs.status, ["completed", "collected"])).groupBy(stringJobs.customerId),
  ]);

  const saleMap = new Map(periodSaleRows.filter((r) => r.customerId != null).map((r) => [r.customerId as string, r]));
  const jobMap = new Map(periodJobRows.map((r) => [r.customerId, r.count]));
  const lastPurchaseMap = new Map(lastPurchaseRows.filter((r) => r.customerId != null).map((r) => [r.customerId as string, r.last]));
  const lastJobMap = new Map(lastJobRows.map((r) => [r.customerId, r.last]));

  return customerRows
    .map((c) => {
      const sale = saleMap.get(c.id);
      const totalSalesCents = Number(sale?.total ?? 0);
      const numberOfSales = sale?.count ?? 0;
      return {
        customerId: c.id,
        code: c.code,
        name: c.name,
        totalSalesCents,
        numberOfSales,
        stringJobsInPeriod: jobMap.get(c.id) ?? 0,
        avgSaleValueCents: numberOfSales > 0 ? Math.round(totalSalesCents / numberOfSales) : null,
        lastPurchase: lastPurchaseMap.get(c.id) ?? null,
        lastStringJob: lastJobMap.get(c.id) ?? null,
      };
    })
    .filter((r) => r.numberOfSales > 0 || r.stringJobsInPeriod > 0);
}

/** Customer Performance export (Phase 8 §41). Dates as ISO strings — plain,
 * parseable, matching the convention every date column in this app's other
 * exports uses (raw values, not a locale display string). */
export async function exportCustomerPerformanceCsv(filters: FinancialsFilters): Promise<string> {
  const rows = await listCustomerPerformance(filters);
  return toCsv(
    ["Code", "Name", "Total sales (cents)", "Number of sales", "String jobs (period)", "Avg sale value (cents)", "Last purchase", "Last string job"],
    rows.map((r) => [r.code, r.name, r.totalSalesCents, r.numberOfSales, r.stringJobsInPeriod, r.avgSaleValueCents, r.lastPurchase ? new Date(r.lastPurchase).toISOString() : "", r.lastStringJob ? new Date(r.lastStringJob).toISOString() : ""]),
  );
}
