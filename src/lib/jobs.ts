import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, stringJobs, stringJobServices, stringJobStrings } from "@/db/schema";
import { getRacket, type RacketWithSpecs } from "./rackets";
import { racketLabel } from "./racket-label";

export type StringJob = typeof stringJobs.$inferSelect;
export type StringJobString = typeof stringJobStrings.$inferSelect;
export type StringJobService = typeof stringJobServices.$inferSelect;
export type JobStatus = StringJob["status"];
export type JobPaymentStatus = StringJob["paymentStatus"];
export type SetupType = StringJob["setupType"];
export type PreStretchType = StringJob["preStretchType"];

export interface StringSetupInput {
  role: "main" | "cross";
  customerSupplied: boolean;
  brand: string;
  stringName: string;
  gauge?: string | null;
  colour?: string | null;
  tension: string;
  tensionUnit: "kg" | "lb";
}

export interface ServiceInput {
  serviceName: string;
  quantity: string;
  unitPriceCents: number;
  notes?: string | null;
}

export interface JobInput {
  customerId: string;
  customerRacketId: string;
  setupType: SetupType;
  receivedOn: string;
  dueOn?: string | null;
  numberOfKnots?: number | null;
  preStretchType: PreStretchType;
  preStretchPct?: string | null;
  paymentStatus: JobPaymentStatus;
  paymentMethod?: StringJob["paymentMethod"];
  discountCents: number;
  generalNotes?: string | null;
  stringingNotes?: string | null;
  strings: StringSetupInput[];
  services: ServiceInput[];
}

function serviceTotal(s: ServiceInput): number {
  const qty = Number(s.quantity) || 1;
  return Math.round(s.unitPriceCents * qty);
}

function computeFinalPriceCents(services: ServiceInput[], discountCents: number): number {
  const subtotal = services.reduce((sum, s) => sum + serviceTotal(s), 0);
  return Math.max(0, subtotal - discountCents);
}

function stringValues(jobId: string, strings: StringSetupInput[]) {
  return strings.map((s) => ({
    stringJobId: jobId,
    role: s.role,
    customerSupplied: s.customerSupplied,
    brandSnapshot: s.brand.trim(),
    stringNameSnapshot: s.stringName.trim(),
    gaugeSnapshot: s.gauge?.trim() || null,
    colourSnapshot: s.colour?.trim() || null,
    tension: s.tension,
    tensionUnit: s.tensionUnit,
  }));
}

function serviceValues(jobId: string, services: ServiceInput[]) {
  return services.map((s) => ({
    stringJobId: jobId,
    serviceName: s.serviceName.trim(),
    quantity: s.quantity,
    unitPriceCents: s.unitPriceCents,
    totalCents: serviceTotal(s),
    notes: s.notes?.trim() || null,
  }));
}

// -- create / update / status / delete --------------------------------------

export async function createJob(input: JobInput): Promise<StringJob> {
  const [customer] = await db.select().from(customers).where(eq(customers.id, input.customerId)).limit(1);
  const racketResult = await getRacket(input.customerRacketId);
  if (!customer || !racketResult) throw new Error("Customer or racket not found");

  const finalPriceCents = computeFinalPriceCents(input.services, input.discountCents);
  const r = racketResult.racket;

  const [job] = await db
    .insert(stringJobs)
    .values({
      customerId: input.customerId,
      customerRacketId: input.customerRacketId,
      setupType: input.setupType,
      receivedOn: input.receivedOn,
      dueOn: input.dueOn || null,
      numberOfKnots: input.numberOfKnots ?? null,
      preStretchType: input.preStretchType,
      preStretchPct: input.preStretchType === "machine" ? input.preStretchPct || null : null,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod || null,
      discountCents: input.discountCents,
      finalPriceCents,
      generalNotes: input.generalNotes?.trim() || null,
      stringingNotes: input.stringingNotes?.trim() || null,
      racketLabel: racketLabel({
        brand: r.effectiveBrand,
        series: r.effectiveSeries,
        model: r.effectiveModel,
        generationYear: r.effectiveGenerationYear,
        generationName: r.effectiveGenerationName,
      }),
      customerName: customer.name,
    })
    .returning();

  await db.insert(stringJobStrings).values(stringValues(job.id, input.strings));
  if (input.services.length) {
    await db.insert(stringJobServices).values(serviceValues(job.id, input.services));
  }

  return job;
}

/** Full replace of strings/services on edit — simpler than diffing two or
 * three rows, and Phase 4's brief calls editing "relatively straightforward"
 * for now. Never touches status/completedAt/collectedAt (see
 * changeJobStatus) or the customer/racket snapshot fields — the edit form
 * doesn't let you reassign a job to a different customer or racket. */
export async function updateJob(id: string, input: JobInput): Promise<StringJob | null> {
  const finalPriceCents = computeFinalPriceCents(input.services, input.discountCents);

  const [job] = await db
    .update(stringJobs)
    .set({
      setupType: input.setupType,
      receivedOn: input.receivedOn,
      dueOn: input.dueOn || null,
      numberOfKnots: input.numberOfKnots ?? null,
      preStretchType: input.preStretchType,
      preStretchPct: input.preStretchType === "machine" ? input.preStretchPct || null : null,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod || null,
      discountCents: input.discountCents,
      finalPriceCents,
      generalNotes: input.generalNotes?.trim() || null,
      stringingNotes: input.stringingNotes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(stringJobs.id, id))
    .returning();
  if (!job) return null;

  await db.delete(stringJobStrings).where(eq(stringJobStrings.stringJobId, id));
  await db.insert(stringJobStrings).values(stringValues(id, input.strings));

  await db.delete(stringJobServices).where(eq(stringJobServices.stringJobId, id));
  if (input.services.length) {
    await db.insert(stringJobServices).values(serviceValues(id, input.services));
  }

  return job;
}

/** completedAt/collectedAt are set once, the moment a job first reaches that
 * status — never overwritten by a later edit or a second status change, so
 * "when was this actually finished" stays a true historical fact. */
export async function changeJobStatus(id: string, status: JobStatus): Promise<StringJob | null> {
  const [existing] = await db.select().from(stringJobs).where(eq(stringJobs.id, id)).limit(1);
  if (!existing) return null;
  const patch: { status: JobStatus; updatedAt: Date; completedAt?: Date; collectedAt?: Date } = { status, updatedAt: new Date() };
  if (status === "completed" && !existing.completedAt) patch.completedAt = new Date();
  if (status === "collected" && !existing.collectedAt) patch.collectedAt = new Date();
  const [row] = await db.update(stringJobs).set(patch).where(eq(stringJobs.id, id)).returning();
  return row ?? null;
}

export async function changePaymentStatus(id: string, paymentStatus: JobPaymentStatus): Promise<StringJob | null> {
  const [row] = await db.update(stringJobs).set({ paymentStatus, updatedAt: new Date() }).where(eq(stringJobs.id, id)).returning();
  return row ?? null;
}

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === FOREIGN_KEY_VIOLATION;
}

/** True, permanent deletion (mistaken entries only — prefer changeJobStatus
 * to "cancelled" for a real job that didn't go ahead, per the brief). Its
 * own strings/services rows cascade automatically; a future Sale line
 * referencing this job (Phase 6) blocks it instead, same guard pattern as
 * deleteRacket/deleteModel. */
export async function deleteJob(id: string): Promise<"deleted" | "in_use"> {
  try {
    await db.delete(stringJobs).where(eq(stringJobs.id, id));
    return "deleted";
  } catch (err) {
    if (isForeignKeyViolation(err)) return "in_use";
    throw err;
  }
}

// -- reads --------------------------------------------------------------

async function stringsByJobId(jobIds: string[]): Promise<Map<string, StringJobString[]>> {
  if (jobIds.length === 0) return new Map();
  const rows = await db.select().from(stringJobStrings).where(inArray(stringJobStrings.stringJobId, jobIds));
  const map = new Map<string, StringJobString[]>();
  for (const row of rows) {
    const arr = map.get(row.stringJobId) ?? [];
    arr.push(row);
    map.set(row.stringJobId, arr);
  }
  return map;
}

export interface JobListRow {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  customerPhone: string;
  customerRacketId: string;
  racketCode: string;
  racketLabel: string;
  setupType: SetupType;
  mainString: string;
  crossString: string;
  mainTension: string | null;
  crossTension: string | null;
  tensionUnit: "kg" | "lb";
  status: JobStatus;
  receivedOn: string;
  dueOn: string | null;
  paymentStatus: JobPaymentStatus;
  finalPriceCents: number;
  createdAt: Date;
}

function stringDisplay(s: StringJobString | undefined): string {
  if (!s) return "—";
  return [s.brandSnapshot, s.stringNameSnapshot].filter(Boolean).join(" ");
}

/** Everything the Jobs list needs, fetched in full and searched/filtered/
 * sorted client-side — same pattern as CustomersView/CatalogueView, at the
 * scale a single-stringer business actually runs at. */
export async function listJobs(): Promise<JobListRow[]> {
  const rows = await db
    .select({ job: stringJobs, customerCode: customers.code, customerPhone: customers.phone, racketCode: customerRackets.code })
    .from(stringJobs)
    .innerJoin(customers, eq(customers.id, stringJobs.customerId))
    .innerJoin(customerRackets, eq(customerRackets.id, stringJobs.customerRacketId))
    .orderBy(desc(stringJobs.receivedOn), desc(stringJobs.createdAt));
  if (rows.length === 0) return [];

  const stringsMap = await stringsByJobId(rows.map((r) => r.job.id));

  return rows.map((r) => {
    const strings = stringsMap.get(r.job.id) ?? [];
    const main = strings.find((s) => s.role === "main");
    const cross = strings.find((s) => s.role === "cross");
    return {
      id: r.job.id,
      code: r.job.code,
      customerId: r.job.customerId,
      customerName: r.job.customerName,
      customerCode: r.customerCode,
      customerPhone: r.customerPhone,
      customerRacketId: r.job.customerRacketId,
      racketCode: r.racketCode,
      racketLabel: r.job.racketLabel,
      setupType: r.job.setupType,
      mainString: stringDisplay(main),
      crossString: stringDisplay(cross),
      mainTension: main?.tension ?? null,
      crossTension: cross?.tension ?? null,
      tensionUnit: main?.tensionUnit ?? cross?.tensionUnit ?? "lb",
      status: r.job.status,
      receivedOn: r.job.receivedOn,
      dueOn: r.job.dueOn,
      paymentStatus: r.job.paymentStatus,
      finalPriceCents: r.job.finalPriceCents,
      createdAt: r.job.createdAt,
    };
  });
}

export interface JobStats {
  activeJobs: number;
  dueToday: number;
  readyForCollection: number;
  completedThisMonth: number;
}

export async function getJobStats(): Promise<JobStats> {
  const [[active], [dueToday], [ready], [completed]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(stringJobs).where(inArray(stringJobs.status, ["received", "waiting", "in_progress"])),
    db.select({ count: sql<number>`count(*)::int` }).from(stringJobs).where(sql`${stringJobs.dueOn} = current_date and ${stringJobs.status} not in ('collected','cancelled')`),
    db.select({ count: sql<number>`count(*)::int` }).from(stringJobs).where(eq(stringJobs.status, "completed")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stringJobs)
      .where(sql`${stringJobs.completedAt} >= date_trunc('month', current_date) and ${stringJobs.completedAt} < date_trunc('month', current_date) + interval '1 month'`),
  ]);
  return {
    activeJobs: active?.count ?? 0,
    dueToday: dueToday?.count ?? 0,
    readyForCollection: ready?.count ?? 0,
    completedThisMonth: completed?.count ?? 0,
  };
}

export interface JobDetail extends StringJob {
  customer: typeof customers.$inferSelect;
  racket: RacketWithSpecs;
  strings: StringJobString[];
  services: StringJobService[];
}

export async function getJob(id: string): Promise<JobDetail | null> {
  const [job] = await db.select().from(stringJobs).where(eq(stringJobs.id, id)).limit(1);
  if (!job) return null;
  const [[customer], racketResult, strings, services] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1),
    getRacket(job.customerRacketId),
    db.select().from(stringJobStrings).where(eq(stringJobStrings.stringJobId, id)),
    db.select().from(stringJobServices).where(eq(stringJobServices.stringJobId, id)),
  ]);
  if (!customer || !racketResult) return null;
  return { ...job, customer, racket: racketResult.racket, strings, services };
}

export interface JobHistoryRow {
  id: string;
  code: string;
  receivedOn: string;
  racketLabel: string;
  mainString: string;
  crossString: string;
  mainTension: string | null;
  crossTension: string | null;
  tensionUnit: "kg" | "lb";
  numberOfKnots: number | null;
  status: JobStatus;
  paymentStatus: JobPaymentStatus;
  finalPriceCents: number;
}

function toHistoryRows(jobs: StringJob[], stringsMap: Map<string, StringJobString[]>): JobHistoryRow[] {
  return jobs.map((job) => {
    const strings = stringsMap.get(job.id) ?? [];
    const main = strings.find((s) => s.role === "main");
    const cross = strings.find((s) => s.role === "cross");
    return {
      id: job.id,
      code: job.code,
      receivedOn: job.receivedOn,
      racketLabel: job.racketLabel,
      mainString: stringDisplay(main),
      crossString: stringDisplay(cross),
      mainTension: main?.tension ?? null,
      crossTension: cross?.tension ?? null,
      tensionUnit: main?.tensionUnit ?? cross?.tensionUnit ?? "lb",
      numberOfKnots: job.numberOfKnots,
      status: job.status,
      paymentStatus: job.paymentStatus,
      finalPriceCents: job.finalPriceCents,
    };
  });
}

/** Newest first — powers the customer profile's Stringing history tab. */
export async function listJobsForCustomer(customerId: string): Promise<JobHistoryRow[]> {
  const jobs = await db.select().from(stringJobs).where(eq(stringJobs.customerId, customerId)).orderBy(desc(stringJobs.receivedOn), desc(stringJobs.createdAt));
  const stringsMap = await stringsByJobId(jobs.map((j) => j.id));
  return toHistoryRows(jobs, stringsMap);
}

/** Newest first — powers the customer racket profile's Stringing history. */
export async function listJobsForRacket(customerRacketId: string): Promise<JobHistoryRow[]> {
  const jobs = await db.select().from(stringJobs).where(eq(stringJobs.customerRacketId, customerRacketId)).orderBy(desc(stringJobs.receivedOn), desc(stringJobs.createdAt));
  const stringsMap = await stringsByJobId(jobs.map((j) => j.id));
  return toHistoryRows(jobs, stringsMap);
}

export interface PreviousJobSetup {
  jobId: string;
  jobCode: string;
  receivedOn: string;
  setupType: SetupType;
  strings: StringJobString[];
  services: StringJobService[];
  discountCents: number;
  numberOfKnots: number | null;
  preStretchType: PreStretchType;
  preStretchPct: string | null;
  stringingNotes: string | null;
  finalPriceCents: number;
}

async function toPreviousJobSetup(row: StringJob): Promise<PreviousJobSetup> {
  const [strings, services] = await Promise.all([
    db.select().from(stringJobStrings).where(eq(stringJobStrings.stringJobId, row.id)),
    db.select().from(stringJobServices).where(eq(stringJobServices.stringJobId, row.id)),
  ]);
  return {
    jobId: row.id,
    jobCode: row.code,
    receivedOn: row.receivedOn,
    setupType: row.setupType,
    strings,
    services,
    discountCents: row.discountCents,
    numberOfKnots: row.numberOfKnots,
    preStretchType: row.preStretchType,
    preStretchPct: row.preStretchPct,
    stringingNotes: row.stringingNotes,
    finalPriceCents: row.finalPriceCents,
  };
}

/** Most recent non-cancelled job for this racket — "Last string job" and
 * the source for "Repeat previous setup", from New String Job or a racket
 * profile. Price/services are included so repeating a setup can suggest a
 * full price too (brief §26: "may be shown or suggested"), never copying
 * job id/dates/status/payment status. */
export async function getPreviousJobForRacket(customerRacketId: string, excludeJobId?: string): Promise<PreviousJobSetup | null> {
  const [row] = await db
    .select()
    .from(stringJobs)
    .where(
      and(
        eq(stringJobs.customerRacketId, customerRacketId),
        sql`${stringJobs.status} != 'cancelled'`,
        excludeJobId ? sql`${stringJobs.id} != ${excludeJobId}` : sql`true`,
      ),
    )
    .orderBy(desc(stringJobs.receivedOn), desc(stringJobs.createdAt))
    .limit(1);
  if (!row) return null;
  return toPreviousJobSetup(row);
}

/** Same shape as getPreviousJobForRacket, but for a specific job (the
 * "Repeat / duplicate" action on a job's own detail page, which may not be
 * the racket's most recent job). */
export async function getJobSetupForRepeat(jobId: string): Promise<PreviousJobSetup | null> {
  const [row] = await db.select().from(stringJobs).where(eq(stringJobs.id, jobId)).limit(1);
  if (!row) return null;
  return toPreviousJobSetup(row);
}
