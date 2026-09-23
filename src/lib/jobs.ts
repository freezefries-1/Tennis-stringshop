import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, stringJobInventoryAllocations, stringJobs, stringJobServices, stringJobStrings } from "@/db/schema";
import { getRacket, type RacketWithSpecs } from "./rackets";
import { racketLabel } from "./racket-label";
import { allocateForRole, InsufficientStockError, previewStock, reverseAllocationsForRole, type StockUnit } from "./string-inventory";
import { isForeignKeyViolation } from "./db-errors";
import { createJobSale, getSale, resyncJobSale, SaleLockedError, type SaleDetail } from "./sales";

export type StringJob = typeof stringJobs.$inferSelect;
export type StringJobString = typeof stringJobStrings.$inferSelect;
export type StringJobService = typeof stringJobServices.$inferSelect;
export type StringJobAllocation = typeof stringJobInventoryAllocations.$inferSelect;
export type JobStatus = StringJob["status"];
export type JobPaymentStatus = StringJob["paymentStatus"];
export type SetupType = StringJob["setupType"];
export type PreStretchType = StringJob["preStretchType"];

export interface StringSetupInput {
  role: "main" | "cross";
  customerSupplied: boolean;
  /** SportCraft Stock only — set via the string product picker, never for
   * customer-supplied strings (brief §15/§17). */
  stringProductId?: string | null;
  brand: string;
  stringName: string;
  gauge?: string | null;
  colour?: string | null;
  tension: string;
  tensionUnit: "kg" | "lb";
  /** Actual string used — drives FIFO deduction for SportCraft Stock lines,
   * optional/informational for customer-supplied ones (brief §11/§12). */
  quantityUsed?: string | null;
  usageUnit?: StockUnit | null;
}

export interface StockShortage {
  role: "main" | "cross";
  productLabel: string;
  neededM: string;
  availableM: string;
  unit: StockUnit;
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
    // Customer-supplied lines never carry a product link, no matter what
    // was passed in — this is the one place that invariant is enforced at
    // write time (brief §15: "must never reduce SportCraft inventory").
    stringProductId: s.customerSupplied ? null : s.stringProductId || null,
    customerSupplied: s.customerSupplied,
    brandSnapshot: s.brand.trim(),
    stringNameSnapshot: s.stringName.trim(),
    gaugeSnapshot: s.gauge?.trim() || null,
    colourSnapshot: s.colour?.trim() || null,
    tension: s.tension,
    tensionUnit: s.tensionUnit,
    quantityUsed: s.quantityUsed?.trim() || null,
    usageUnit: s.quantityUsed?.trim() ? s.usageUnit ?? "m" : null,
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

function shortageFromLine(line: StringSetupInput, available: number): StockShortage {
  const qty = Number(line.quantityUsed) || 0;
  return { role: line.role, productLabel: `${line.brand} ${line.stringName}`.trim(), neededM: qty.toFixed(2), availableM: available.toFixed(2), unit: line.usageUnit ?? "m" };
}

/** A SportCraft-stock line that actually needs inventory deducted — a
 * customer-supplied line, an unlinked/manual line, or a zero/blank usage
 * never reaches FIFO allocation at all (brief §15). */
function needsAllocation(line: StringSetupInput): line is StringSetupInput & { stringProductId: string; quantityUsed: string } {
  return !line.customerSupplied && !!line.stringProductId && !!line.quantityUsed && Number(line.quantityUsed) > 0;
}

export type UpdateJobResult =
  | { ok: true; job: StringJob }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "insufficient_stock"; shortages: StockShortage[] }
  | { ok: false; reason: "sale_locked"; saleCode: string };

/** Full replace of strings/services on edit — simpler than diffing two or
 * three rows, and Phase 4's brief calls editing "relatively straightforward"
 * for now. Never touches status/completedAt/collectedAt (see
 * changeJobStatus) or the customer/racket snapshot fields — the edit form
 * doesn't let you reassign a job to a different customer or racket.
 *
 * Phase 5: if this job's inventory has already been processed
 * (inventoryProcessedAt set) and a role's string/quantity actually changed,
 * that role's existing FIFO allocation is reversed and a corrected one is
 * made for the new quantity (brief §25) — "reverse, recalculate, re-
 * allocate", never a silent overwrite of the deducted amount. Roles whose
 * inventory-relevant fields are unchanged (or that were never allocated in
 * the first place) are left untouched — editing a job's notes/dates/knots
 * never touches inventory. */
export async function updateJob(id: string, input: JobInput, opts?: { allowStockOverride?: boolean }): Promise<UpdateJobResult> {
  const [existingJob] = await db.select().from(stringJobs).where(eq(stringJobs.id, id)).limit(1);
  if (!existingJob) return { ok: false, reason: "not_found" };

  const existingLines = existingJob.inventoryProcessedAt ? await db.select().from(stringJobStrings).where(eq(stringJobStrings.stringJobId, id)) : [];

  const changedRoles = existingJob.inventoryProcessedAt
    ? input.strings.filter((newLine) => {
        const old = existingLines.find((l) => l.role === newLine.role);
        if (!old) return false; // nothing to reverse — always exactly main+cross
        return (
          old.customerSupplied !== newLine.customerSupplied ||
          (old.stringProductId ?? null) !== (newLine.stringProductId ?? null) ||
          Number(old.quantityUsed ?? 0) !== (Number(newLine.quantityUsed) || 0)
        );
      })
    : [];

  if (!opts?.allowStockOverride) {
    const shortages: StockShortage[] = [];
    for (const line of changedRoles) {
      if (!needsAllocation(line)) continue;
      const { sufficient, available } = await previewStock(line.stringProductId, Number(line.quantityUsed));
      if (!sufficient) shortages.push(shortageFromLine(line, available));
    }
    if (shortages.length) return { ok: false, reason: "insufficient_stock", shortages };
  }

  const finalPriceCents = computeFinalPriceCents(input.services, input.discountCents);

  try {
    const job = await db.transaction(async (tx) => {
      for (const line of changedRoles) {
        await reverseAllocationsForRole(tx, id, line.role, "String usage edited");
      }

      const [row] = await tx
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

      await tx.delete(stringJobStrings).where(eq(stringJobStrings.stringJobId, id));
      await tx.insert(stringJobStrings).values(stringValues(id, input.strings));

      await tx.delete(stringJobServices).where(eq(stringJobServices.stringJobId, id));
      if (input.services.length) {
        await tx.insert(stringJobServices).values(serviceValues(id, input.services));
      }

      for (const line of changedRoles) {
        if (!needsAllocation(line)) continue;
        await allocateForRole({
          tx,
          stringJobId: id,
          role: line.role,
          stringProductId: line.stringProductId,
          quantityNeeded: Number(line.quantityUsed),
          unit: line.usageUnit ?? "m",
          allowOverride: !!opts?.allowStockOverride,
        });
      }

      // Phase 6 — a job that already has a linked Sale gets it resynced to
      // the just-saved services/discount and the CURRENT string COGS (read
      // fresh from string_job_inventory_allocations, which the reversals/
      // reallocations above have already brought up to date either way) in
      // the SAME transaction as the job edit itself: either both land or
      // neither does.
      if (row.saleId) {
        const currentAllocations = await tx.select().from(stringJobInventoryAllocations).where(and(eq(stringJobInventoryAllocations.stringJobId, id), isNull(stringJobInventoryAllocations.reversedAt)));
        const stringCogsCents = currentAllocations.reduce((sum, a) => sum + a.cogsAmountCents, 0);
        await resyncJobSale(tx, row.saleId, serviceValues(id, input.services), input.discountCents, stringCogsCents);
      }

      return row;
    });

    return { ok: true, job };
  } catch (err) {
    if (err instanceof SaleLockedError) return { ok: false, reason: "sale_locked", saleCode: err.saleCode };
    throw err;
  }
}

export type ChangeJobStatusResult = { ok: true; job: StringJob } | { ok: false; reason: "not_found" } | { ok: false; reason: "insufficient_stock"; shortages: StockShortage[] };

/** completedAt/collectedAt are set once, the moment a job first reaches that
 * status — never overwritten by a later edit or a second status change, so
 * "when was this actually finished" stays a true historical fact.
 *
 * Phase 5: the first time a job reaches "completed", each SportCraft-stock
 * string line is FIFO-allocated and deducted (brief §13/§14) —
 * inventoryProcessedAt guards this to exactly once, ever, no matter how
 * many times status changes afterwards or how many times this is called
 * concurrently (see the row lock below). Leaving the completed/collected
 * pair for any other status (cancelled, or a correction moving back to an
 * earlier status) reverses whatever was allocated (brief §24), clearing
 * inventoryProcessedAt so a later re-completion allocates fresh. */
export async function changeJobStatus(id: string, status: JobStatus, opts?: { allowStockOverride?: boolean }): Promise<ChangeJobStatusResult> {
  const [existing] = await db.select().from(stringJobs).where(eq(stringJobs.id, id)).limit(1);
  if (!existing) return { ok: false, reason: "not_found" };

  if (status === "completed" && existing.inventoryProcessedAt == null && !opts?.allowStockOverride) {
    const lines = await db.select().from(stringJobStrings).where(eq(stringJobStrings.stringJobId, id));
    const shortages: StockShortage[] = [];
    for (const line of lines) {
      if (line.customerSupplied || !line.stringProductId || !line.quantityUsed || Number(line.quantityUsed) <= 0) continue;
      const { sufficient, available } = await previewStock(line.stringProductId, Number(line.quantityUsed));
      if (!sufficient) shortages.push({ role: line.role, productLabel: `${line.brandSnapshot} ${line.stringNameSnapshot}`, neededM: Number(line.quantityUsed).toFixed(2), availableM: available.toFixed(2), unit: line.usageUnit ?? "m" });
    }
    if (shortages.length) return { ok: false, reason: "insufficient_stock", shortages };
  }

  try {
    const job = await db.transaction(async (tx) => {
      const [locked] = await tx.select().from(stringJobs).where(eq(stringJobs.id, id)).for("update");
      if (!locked) return null;

      const patch: { status: JobStatus; updatedAt: Date; completedAt?: Date; collectedAt?: Date; inventoryProcessedAt?: Date | null; saleId?: string } = { status, updatedAt: new Date() };
      if (status === "completed" && !locked.completedAt) patch.completedAt = new Date();
      if (status === "collected" && !locked.collectedAt) patch.collectedAt = new Date();

      const stockConsumingStatus = status === "completed" || status === "collected";

      if (status === "completed" && locked.inventoryProcessedAt == null) {
        const lines = await tx.select().from(stringJobStrings).where(eq(stringJobStrings.stringJobId, id));
        let stringCogsCents = 0;
        for (const line of lines) {
          if (line.customerSupplied || !line.stringProductId || !line.quantityUsed || Number(line.quantityUsed) <= 0) continue;
          const result = await allocateForRole({
            tx,
            stringJobId: id,
            role: line.role,
            stringProductId: line.stringProductId,
            quantityNeeded: Number(line.quantityUsed),
            unit: line.usageUnit ?? "m",
            allowOverride: !!opts?.allowStockOverride,
          });
          stringCogsCents += result.cogsCents;
        }
        patch.inventoryProcessedAt = new Date();

        // Phase 6 — the ONE linked Sale a String Job can ever create (brief
        // §25/§27), guarded by the same inventoryProcessedAt idempotency
        // lock as the inventory deduction above, PLUS locked.saleId itself:
        // a job that was completed once (creating its Sale), reverted, and
        // is now being re-completed has inventoryProcessedAt back to null
        // (cleared on the revert below) but keeps its original saleId
        // forever — this condition is what stops that re-completion from
        // trying to create a second Sale and hitting sales.stringJobId's
        // UNIQUE constraint.
        if (locked.saleId == null) {
          const services = await tx.select().from(stringJobServices).where(eq(stringJobServices.stringJobId, id));
          const sale = await createJobSale(tx, {
            stringJobId: id,
            customerId: locked.customerId,
            services: services.map((s) => ({ serviceName: s.serviceName, quantity: s.quantity, unitPriceCents: s.unitPriceCents, totalCents: s.totalCents })),
            discountCents: locked.discountCents,
            stringCogsCents,
          });
          patch.saleId = sale.id;
        }
      } else if (!stockConsumingStatus && locked.inventoryProcessedAt != null) {
        await reverseAllocationsForRole(tx, id, "main", `Job status changed to ${status}`);
        await reverseAllocationsForRole(tx, id, "cross", `Job status changed to ${status}`);
        patch.inventoryProcessedAt = null;
      }

      const [row] = await tx.update(stringJobs).set(patch).where(eq(stringJobs.id, id)).returning();
      return row;
    });
    if (!job) return { ok: false, reason: "not_found" };
    return { ok: true, job };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { ok: false, reason: "insufficient_stock", shortages: [{ role: "main", productLabel: "This string", neededM: err.needed.toFixed(2), availableM: err.available.toFixed(2), unit: "m" }] };
    }
    throw err;
  }
}

/** Phase 4's direct payment-status setter — refuses to write once the job
 * has a linked Sale (Phase 6), since that Sale is the financial source of
 * truth from that point on (brief §56) and this column is frozen at
 * whatever it read at completion time. recordSalePayment (src/lib/sales.ts)
 * is the equivalent action for a job with a linked Sale — the job detail
 * page picks between the two based on whether linkedSale is set. */
export async function changePaymentStatus(id: string, paymentStatus: JobPaymentStatus): Promise<StringJob | null> {
  const [row] = await db.update(stringJobs).set({ paymentStatus, updatedAt: new Date() }).where(and(eq(stringJobs.id, id), isNull(stringJobs.saleId))).returning();
  return row ?? null;
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
  /** Active (un-reversed) FIFO allocations only — a reversed allocation no
   * longer contributes to this job's displayed COGS, but the row itself is
   * never deleted (still visible in the product's own movement history). */
  allocations: StringJobAllocation[];
  /** Sum of any service line named "String cost" (the suggested default —
   * see job-form-types.ts) — the closest thing to a "string revenue" figure
   * this free-text line-item model has. 0 if no such line exists. */
  stringRevenueCents: number;
  stringCogsCents: number;
  stringGrossProfitCents: number;
  /** Phase 6 — the job's one linked Sale (see createJobSale in
   * src/lib/sales.ts), null for a job never completed under Phase 6, or a
   * job completed before it (see the Phase 6 report's migration notes).
   * Once set, this is the financial source of truth for the job — its own
   * paymentStatus column below is frozen from that point on. */
  linkedSale: SaleDetail | null;
}

export async function getJob(id: string): Promise<JobDetail | null> {
  const [job] = await db.select().from(stringJobs).where(eq(stringJobs.id, id)).limit(1);
  if (!job) return null;
  const [[customer], racketResult, strings, services, allocations, linkedSale] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, job.customerId)).limit(1),
    getRacket(job.customerRacketId),
    db.select().from(stringJobStrings).where(eq(stringJobStrings.stringJobId, id)),
    db.select().from(stringJobServices).where(eq(stringJobServices.stringJobId, id)),
    db.select().from(stringJobInventoryAllocations).where(and(eq(stringJobInventoryAllocations.stringJobId, id), isNull(stringJobInventoryAllocations.reversedAt))),
    job.saleId ? getSale(job.saleId) : Promise.resolve(null),
  ]);
  if (!customer || !racketResult) return null;
  const stringRevenueCents = services.filter((s) => s.serviceName.trim().toLowerCase() === "string cost").reduce((sum, s) => sum + s.totalCents, 0);
  const stringCogsCents = allocations.reduce((sum, a) => sum + a.cogsAmountCents, 0);
  return { ...job, customer, racket: racketResult.racket, strings, services, allocations, stringRevenueCents, stringCogsCents, stringGrossProfitCents: stringRevenueCents - stringCogsCents, linkedSale };
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
