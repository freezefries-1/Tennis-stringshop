import { and, desc, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, sales, stringJobs } from "@/db/schema";

export interface CustomerListRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  racketCount: number;
  jobCount: number;
  lifetimeSpendCents: number;
  lastVisit: Date | null;
  createdAt: Date;
}

export interface CustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

/** All non-archived customers, with counts/spend/last-visit rolled up from
 * their rackets, string jobs and sales. lifetimeSpendCents is Sales'
 * totalCents PLUS finalPriceCents from any completed job that never got a
 * linked Sale — i.e. one finished before Phase 6 shipped, when a completed
 * job started creating its own Sale automatically. Every job from Phase 6
 * onward already has that link, so its revenue is already inside the Sales
 * sum; adding finalPriceCents for those too would double-count it. Only
 * orphaned (saleId is null) completed/collected jobs are ever added here —
 * see sales.ts's revenue-recognition comment for the rest of this rule. */
export async function listCustomers(): Promise<CustomerListRow[]> {
  const rows = await db.select().from(customers).where(isNull(customers.archivedAt)).orderBy(desc(customers.createdAt));
  if (rows.length === 0) return [];

  const [racketCounts, jobStats, saleStats, unlinkedJobStats] = await Promise.all([
    db
      .select({ customerId: customerRackets.customerId, count: sql<number>`count(*)::int` })
      .from(customerRackets)
      .where(isNull(customerRackets.archivedAt))
      .groupBy(customerRackets.customerId),
    db
      .select({
        customerId: stringJobs.customerId,
        count: sql<number>`count(*)::int`,
        lastVisit: sql<Date | null>`max(${stringJobs.completedAt})`,
      })
      .from(stringJobs)
      .where(sql`${stringJobs.status} != 'cancelled'`)
      .groupBy(stringJobs.customerId),
    db
      .select({
        customerId: sales.customerId,
        total: sql<number>`coalesce(sum(${sales.totalCents}),0)::int`,
        lastVisit: sql<Date | null>`max(${sales.occurredAt})`,
      })
      .from(sales)
      .where(sql`${sales.customerId} is not null`)
      .groupBy(sales.customerId),
    db
      .select({ customerId: stringJobs.customerId, total: sql<number>`coalesce(sum(${stringJobs.finalPriceCents}),0)::int` })
      .from(stringJobs)
      .where(sql`${stringJobs.saleId} is null and ${stringJobs.status} in ('completed', 'collected')`)
      .groupBy(stringJobs.customerId),
  ]);

  const racketMap = new Map(racketCounts.map((r) => [r.customerId, r.count]));
  const jobMap = new Map(jobStats.map((r) => [r.customerId, { count: r.count, lastVisit: r.lastVisit }]));
  const saleMap = new Map(saleStats.map((r) => [r.customerId, { total: r.total, lastVisit: r.lastVisit }]));
  const unlinkedJobMap = new Map(unlinkedJobStats.map((r) => [r.customerId, r.total]));

  return rows.map((c) => {
    const job = jobMap.get(c.id);
    const sale = saleMap.get(c.id);
    const visits = [job?.lastVisit, sale?.lastVisit].filter((d): d is Date => d != null);
    const lastVisit = visits.length ? new Date(Math.max(...visits.map((d) => +new Date(d)))) : null;
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      phone: c.phone,
      email: c.email,
      racketCount: racketMap.get(c.id) ?? 0,
      jobCount: job?.count ?? 0,
      lifetimeSpendCents: (sale?.total ?? 0) + (unlinkedJobMap.get(c.id) ?? 0),
      lastVisit,
      createdAt: c.createdAt,
    };
  });
}

export async function getCustomer(id: string) {
  const [row] = await db.select().from(customers).where(and(sql`${customers.id} = ${id}`, isNull(customers.archivedAt))).limit(1);
  return row ?? null;
}

/** A customer with the same phone number (digits compared, formatting
 * ignored) — used to warn before creating a likely-duplicate record. */
export async function findCustomerByPhone(phone: string, excludeId?: string) {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  const [row] = await db
    .select()
    .from(customers)
    .where(
      and(
        isNull(customers.archivedAt),
        // Note the doubled backslash: inside a normal JS template literal
        // (this isn't String.raw), '\D' silently drops the backslash and
        // becomes the single character "D" — which turned this into
        // regexp_replace(phone, 'D', ...), matching nothing. '\\D' is what
        // actually reaches Postgres as the regex \D (non-digit).
        sql`regexp_replace(${customers.phone}, '\\D', '', 'g') = ${digits}`,
        excludeId ? sql`${customers.id} != ${excludeId}` : sql`true`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createCustomer(input: CustomerInput) {
  const [row] = await db
    .insert(customers)
    .values({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .returning();
  return row;
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const [row] = await db
    .update(customers)
    .set({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .where(sql`${customers.id} = ${id}`)
    .returning();
  return row ?? null;
}

/** Stats for a single customer profile — same rollups as listCustomers,
 * just scoped to one row (see its comment for the lifetimeSpendCents
 * rule: Sales totals plus any pre-Phase-6 completed job that never got a
 * linked Sale, never double-adding a job that already has one). */
export async function getCustomerStats(id: string) {
  const [[jobRow], [saleRow], [unlinkedJobRow]] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int`, lastVisit: sql<Date | null>`max(${stringJobs.completedAt})` })
      .from(stringJobs)
      .where(sql`${stringJobs.customerId} = ${id} and ${stringJobs.status} != 'cancelled'`),
    db
      .select({ total: sql<number>`coalesce(sum(${sales.totalCents}),0)::int`, lastVisit: sql<Date | null>`max(${sales.occurredAt})` })
      .from(sales)
      .where(sql`${sales.customerId} = ${id}`),
    db
      .select({ total: sql<number>`coalesce(sum(${stringJobs.finalPriceCents}),0)::int` })
      .from(stringJobs)
      .where(sql`${stringJobs.customerId} = ${id} and ${stringJobs.saleId} is null and ${stringJobs.status} in ('completed', 'collected')`),
  ]);
  const visits = [jobRow?.lastVisit, saleRow?.lastVisit].filter((d): d is Date => d != null);
  return {
    jobCount: jobRow?.count ?? 0,
    lifetimeSpendCents: (saleRow?.total ?? 0) + (unlinkedJobRow?.total ?? 0),
    lastVisit: visits.length ? new Date(Math.max(...visits.map((d) => +new Date(d)))) : null,
  };
}
