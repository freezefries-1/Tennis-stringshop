import { and, asc, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  stringInventoryBatches,
  stringInventoryMovements,
  stringJobInventoryAllocations,
  stringProducts,
  suppliers,
  type stringStockUnitEnum,
} from "@/db/schema";
import { getInventoryDefaults } from "./settings";
import { isForeignKeyViolation } from "./db-errors";

export type StringProduct = typeof stringProducts.$inferSelect;
export type StringInventoryBatch = typeof stringInventoryBatches.$inferSelect;
export type StringInventoryMovement = typeof stringInventoryMovements.$inferSelect;
export type StringJobInventoryAllocation = typeof stringJobInventoryAllocations.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type StockUnit = (typeof stringStockUnitEnum.enumValues)[number];
export type MovementType = StringInventoryMovement["movementType"];

// A DB transaction handle (postgres-js/drizzle) or the top-level db itself —
// every write helper below accepts either, so callers that need several
// writes to commit-or-fail together (job completion, edits, reversals) can
// pass a `tx` from db.transaction(...), while simple one-off calls (receive
// stock, a manual adjustment) can just pass `db`.
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

// -- string products ---------------------------------------------------

export interface StringProductInput {
  brand: string;
  name: string;
  gauge?: string | null;
  colour?: string | null;
  material?: string | null;
  sku?: string | null;
  trackingUnit: StockUnit;
  defaultSellingPriceCents?: number | null;
  lowStockThreshold?: string | null;
  notes?: string | null;
}

function cleanProductInput(input: StringProductInput) {
  return {
    brand: input.brand.trim(),
    name: input.name.trim(),
    gauge: input.gauge?.trim() || null,
    colour: input.colour?.trim() || null,
    material: input.material?.trim() || null,
    sku: input.sku?.trim() || null,
    trackingUnit: input.trackingUnit,
    defaultSellingPriceCents: input.defaultSellingPriceCents ?? null,
    lowStockThreshold: input.lowStockThreshold?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createStringProduct(input: StringProductInput): Promise<StringProduct> {
  const [row] = await db.insert(stringProducts).values(cleanProductInput(input)).returning();
  return row;
}

export async function updateStringProduct(id: string, input: StringProductInput): Promise<StringProduct | null> {
  const [row] = await db
    .update(stringProducts)
    .set({ ...cleanProductInput(input), updatedAt: new Date() })
    .where(eq(stringProducts.id, id))
    .returning();
  return row ?? null;
}

export async function setStringProductArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(stringProducts)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(eq(stringProducts.id, id));
}

/** Same brand + name + gauge + colour already exists — a soft warning
 * before creating a new variant (brief §4), not a hard block: near-
 * identical names can legitimately be different products. */
export async function findDuplicateStringProduct(
  brand: string,
  name: string,
  gauge: string | null,
  colour: string | null,
  excludeId?: string,
): Promise<StringProduct | null> {
  const [row] = await db
    .select()
    .from(stringProducts)
    .where(
      and(
        isNull(stringProducts.archivedAt),
        sql`lower(${stringProducts.brand}) = lower(${brand})`,
        sql`lower(${stringProducts.name}) = lower(${name})`,
        gauge ? eq(stringProducts.gauge, gauge) : sql`${stringProducts.gauge} is null`,
        colour ? sql`lower(${stringProducts.colour}) = lower(${colour})` : sql`${stringProducts.colour} is null`,
        excludeId ? sql`${stringProducts.id} != ${excludeId}` : sql`true`,
      ),
    )
    .limit(1);
  return row ?? null;
}

/** True, permanent deletion — reserved for a mistaken entry (brief §33).
 * Blocked by Postgres if any batch (hence any movement/allocation/job
 * link) still references the product; archiving is the everyday path. */
export async function deleteStringProduct(id: string): Promise<"deleted" | "in_use"> {
  try {
    await db.delete(stringProducts).where(eq(stringProducts.id, id));
    return "deleted";
  } catch (err) {
    if (isForeignKeyViolation(err)) return "in_use";
    throw err;
  }
}

export interface StockSummary {
  available: string; // remaining quantity, this product's trackingUnit
  activeBatches: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

async function stockSummaries(productIds: string[]): Promise<Map<string, { available: number; activeBatches: number }>> {
  const map = new Map<string, { available: number; activeBatches: number }>();
  if (productIds.length === 0) return map;
  const rows = await db
    .select({
      productId: stringInventoryBatches.stringProductId,
      available: sql<string>`coalesce(sum(${stringInventoryBatches.remainingQuantity}), 0)`,
      activeBatches: sql<number>`count(*) filter (where ${stringInventoryBatches.remainingQuantity} > 0)::int`,
    })
    .from(stringInventoryBatches)
    .where(inArray(stringInventoryBatches.stringProductId, productIds))
    .groupBy(stringInventoryBatches.stringProductId);
  for (const r of rows) map.set(r.productId, { available: Number(r.available), activeBatches: r.activeBatches });
  return map;
}

function stockStatus(available: number, threshold: number): StockSummary["status"] {
  if (available <= 0) return "out_of_stock";
  if (available <= threshold) return "low_stock";
  return "in_stock";
}

export interface StringProductRow extends StringProduct {
  available: string;
  activeBatches: number;
  status: StockSummary["status"];
  effectiveThreshold: string;
}

export interface StringProductFilters {
  query?: string;
  brand?: string;
  material?: string;
  status?: "in_stock" | "low_stock" | "out_of_stock";
  includeArchived?: boolean;
}

/** Browse/search the string catalogue — the main Inventory page. Fetched
 * in full and filtered client-side, same pattern as CustomersView/
 * CatalogueView/JobsView, at the scale a single-stringer business runs at. */
export async function listStringProducts(filters: StringProductFilters = {}): Promise<StringProductRow[]> {
  const q = filters.query?.trim();
  const like = q ? `%${q}%` : null;

  const rows = await db
    .select()
    .from(stringProducts)
    .where(
      and(
        filters.includeArchived ? sql`true` : isNull(stringProducts.archivedAt),
        filters.brand ? eq(stringProducts.brand, filters.brand) : sql`true`,
        filters.material ? eq(stringProducts.material, filters.material) : sql`true`,
        like ? sql`(${stringProducts.brand} ilike ${like} or ${stringProducts.name} ilike ${like} or ${stringProducts.colour} ilike ${like} or ${stringProducts.sku} ilike ${like} or ${stringProducts.gauge}::text ilike ${like})` : sql`true`,
      ),
    )
    .orderBy(asc(stringProducts.brand), asc(stringProducts.name), asc(stringProducts.gauge));

  const defaults = await getInventoryDefaults();
  const summaries = await stockSummaries(rows.map((r) => r.id));

  const withStock = rows.map((r) => {
    const s = summaries.get(r.id) ?? { available: 0, activeBatches: 0 };
    const threshold = r.lowStockThreshold != null ? Number(r.lowStockThreshold) : r.trackingUnit === "set" ? defaults.lowStockThresholdSets : defaults.lowStockThresholdM;
    return { ...r, available: s.available.toFixed(2), activeBatches: s.activeBatches, status: stockStatus(s.available, threshold), effectiveThreshold: threshold.toFixed(2) };
  });

  return filters.status ? withStock.filter((r) => r.status === filters.status) : withStock;
}

export async function getStringProduct(id: string): Promise<StringProductRow | null> {
  const [row] = await db.select().from(stringProducts).where(eq(stringProducts.id, id)).limit(1);
  if (!row) return null;
  const defaults = await getInventoryDefaults();
  const summaries = await stockSummaries([id]);
  const s = summaries.get(id) ?? { available: 0, activeBatches: 0 };
  const threshold = row.lowStockThreshold != null ? Number(row.lowStockThreshold) : row.trackingUnit === "set" ? defaults.lowStockThresholdSets : defaults.lowStockThresholdM;
  return { ...row, available: s.available.toFixed(2), activeBatches: s.activeBatches, status: stockStatus(s.available, threshold), effectiveThreshold: threshold.toFixed(2) };
}

/** For the SportCraft Stock string picker on a job — active products only,
 * with live stock so the picker can show "86.4m available" (brief §18)
 * without exposing cost. */
export async function searchStringProductsForPicker(query: string): Promise<(StringProductRow & { label: string })[]> {
  const rows = await listStringProducts({ query, includeArchived: false });
  return rows.map((r) => ({ ...r, label: [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" ") }));
}

export async function listBrandsInUse(): Promise<string[]> {
  const rows = await db.selectDistinct({ brand: stringProducts.brand }).from(stringProducts).where(isNull(stringProducts.archivedAt)).orderBy(asc(stringProducts.brand));
  return rows.map((r) => r.brand);
}

export async function listMaterialsInUse(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ material: stringProducts.material })
    .from(stringProducts)
    .where(and(isNull(stringProducts.archivedAt), sql`${stringProducts.material} is not null`));
  return rows.map((r) => r.material).filter((m): m is string => !!m).sort();
}

export interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValueCents: number;
}

/** Inventory value is the remaining value of every batch (remaining ×
 * cost-per-unit), never quantity × latest purchase price (brief §30). */
export async function getInventorySummary(): Promise<InventorySummary> {
  const products = await listStringProducts({});
  const [valueRow] = await db
    .select({ value: sql<string>`coalesce(sum(${stringInventoryBatches.remainingQuantity} * ${stringInventoryBatches.costPerUnitCents}), 0)` })
    .from(stringInventoryBatches);
  return {
    totalProducts: products.length,
    lowStockCount: products.filter((p) => p.status === "low_stock").length,
    outOfStockCount: products.filter((p) => p.status === "out_of_stock").length,
    inventoryValueCents: Math.round(Number(valueRow?.value ?? 0) / 100),
  };
}

export interface LowStockRow {
  productId: string;
  label: string;
  available: string;
  unit: StockUnit;
  threshold: string;
  status: "low_stock" | "out_of_stock";
}

export async function listLowStockProducts(limit = 8): Promise<LowStockRow[]> {
  const products = await listStringProducts({});
  return products
    .filter((p) => p.status === "low_stock" || p.status === "out_of_stock")
    .sort((a, b) => Number(a.available) - Number(b.available))
    .slice(0, limit)
    .map((p) => ({
      productId: p.id,
      label: [p.brand, p.name, p.gauge ? `${p.gauge}mm` : null, p.colour].filter(Boolean).join(" "),
      available: p.available,
      unit: p.trackingUnit,
      threshold: p.effectiveThreshold,
      status: p.status as "low_stock" | "out_of_stock",
    }));
}

// -- suppliers -----------------------------------------------------------

export async function listSuppliers(includeInactive = false): Promise<Supplier[]> {
  return db
    .select()
    .from(suppliers)
    .where(includeInactive ? undefined : eq(suppliers.active, true))
    .orderBy(asc(suppliers.name));
}

export async function findSupplierByName(name: string): Promise<Supplier | null> {
  const [row] = await db
    .select()
    .from(suppliers)
    .where(sql`lower(${suppliers.name}) = lower(${name})`)
    .limit(1);
  return row ?? null;
}

export async function createSupplier(name: string, contactInfo?: string | null, notes?: string | null): Promise<Supplier> {
  const [row] = await db.insert(suppliers).values({ name: name.trim(), contactInfo: contactInfo?.trim() || null, notes: notes?.trim() || null }).returning();
  return row;
}

// -- receiving stock -------------------------------------------------------

export interface ReceiveStockInput {
  stringProductId: string;
  supplierId?: string | null;
  purchaseDate: string;
  purchaseCostCents: number;
  quantity: string;
  unit: StockUnit;
  supplierReference?: string | null;
  notes?: string | null;
  isOpeningStock?: boolean;
}

/** Creates the batch and its "received" movement together (brief §8/§9) —
 * never just a raw quantity bump. Cost-per-unit is derived once, here, and
 * frozen onto the batch; every later FIFO allocation snapshots it again
 * from the batch, so this is the only place it's ever computed. */
export async function receiveStock(input: ReceiveStockInput): Promise<{ batch: StringInventoryBatch; movement: StringInventoryMovement }> {
  const qty = Number(input.quantity);
  const costPerUnitCents = qty > 0 ? input.purchaseCostCents / qty : 0;

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(stringInventoryBatches)
      .values({
        stringProductId: input.stringProductId,
        supplierId: input.supplierId || null,
        purchaseDate: input.purchaseDate,
        purchaseCostCents: input.purchaseCostCents,
        originalQuantity: input.quantity,
        remainingQuantity: input.quantity,
        unit: input.unit,
        costPerUnitCents: costPerUnitCents.toFixed(4),
        supplierReference: input.supplierReference?.trim() || null,
        notes: input.notes?.trim() || null,
        isOpeningStock: input.isOpeningStock ?? false,
      })
      .returning();

    const [movement] = await tx
      .insert(stringInventoryMovements)
      .values({
        stringProductId: input.stringProductId,
        batchId: batch.id,
        movementType: "received",
        quantityChange: input.quantity,
        unit: input.unit,
        costPerUnitCentsSnapshot: batch.costPerUnitCents,
        reason: input.isOpeningStock ? "Opening inventory" : null,
      })
      .returning();

    return { batch, movement };
  });
}

// -- batches / movements (reads) -------------------------------------------

export interface BatchRow extends StringInventoryBatch {
  supplierName: string | null;
}

export async function listBatchesForProduct(productId: string): Promise<BatchRow[]> {
  const rows = await db
    .select({ batch: stringInventoryBatches, supplierName: suppliers.name })
    .from(stringInventoryBatches)
    .leftJoin(suppliers, eq(suppliers.id, stringInventoryBatches.supplierId))
    .where(eq(stringInventoryBatches.stringProductId, productId))
    .orderBy(asc(stringInventoryBatches.purchaseDate), asc(stringInventoryBatches.createdAt));
  return rows.map((r) => ({ ...r.batch, supplierName: r.supplierName }));
}

export async function getBatch(id: string): Promise<StringInventoryBatch | null> {
  const [row] = await db.select().from(stringInventoryBatches).where(eq(stringInventoryBatches.id, id)).limit(1);
  return row ?? null;
}

export interface MovementRow extends StringInventoryMovement {
  batchNumber: string;
  jobCode: string | null;
}

export async function listMovementsForProduct(productId: string, limit = 100): Promise<MovementRow[]> {
  const rows = await db
    .select({
      movement: stringInventoryMovements,
      batchNumber: stringInventoryBatches.batchNumber,
      jobCode: sql<string | null>`(select code from string_jobs where id = ${stringInventoryMovements.stringJobId})`,
    })
    .from(stringInventoryMovements)
    .innerJoin(stringInventoryBatches, eq(stringInventoryBatches.id, stringInventoryMovements.batchId))
    .where(eq(stringInventoryMovements.stringProductId, productId))
    .orderBy(desc(stringInventoryMovements.occurredAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.movement, batchNumber: r.batchNumber, jobCode: r.jobCode }));
}

export interface RecentMovementRow extends MovementRow {
  productLabel: string;
}

/** Dashboard's "Recent inventory movements" widget. */
export async function listRecentMovements(limit = 8): Promise<RecentMovementRow[]> {
  const rows = await db
    .select({
      movement: stringInventoryMovements,
      batchNumber: stringInventoryBatches.batchNumber,
      jobCode: sql<string | null>`(select code from string_jobs where id = ${stringInventoryMovements.stringJobId})`,
      brand: stringProducts.brand,
      name: stringProducts.name,
      gauge: stringProducts.gauge,
      colour: stringProducts.colour,
    })
    .from(stringInventoryMovements)
    .innerJoin(stringInventoryBatches, eq(stringInventoryBatches.id, stringInventoryMovements.batchId))
    .innerJoin(stringProducts, eq(stringProducts.id, stringInventoryMovements.stringProductId))
    .orderBy(desc(stringInventoryMovements.occurredAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r.movement,
    batchNumber: r.batchNumber,
    jobCode: r.jobCode,
    productLabel: [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" "),
  }));
}

// -- manual adjustments (add / deduct / wastage / correction) --------------

export interface ManualAdjustmentInput {
  batchId: string;
  type: "manual_add" | "manual_deduct" | "wastage" | "correction";
  /** For add/deduct/wastage: the amount to change by (always a positive
   * number here — the sign is derived from `type`). For correction: the
   * new absolute remaining quantity (brief §22, "correct stock to 46m"). */
  amount: string;
  reason: string;
}

export class InsufficientStockError extends Error {
  constructor(public available: number, public needed: number) {
    super(`Only ${available} available, ${needed} needed`);
  }
}

/** Every manual change is its own ledger row with a required reason (brief
 * §21) — never a silent overwrite of remainingQuantity. Deduct/wastage
 * refuse to take a batch negative (this is a correction tool, not a way to
 * force an override — that's the job-completion flow's job). */
export async function recordManualAdjustment(input: ManualAdjustmentInput): Promise<StringInventoryMovement> {
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(stringInventoryBatches).where(eq(stringInventoryBatches.id, input.batchId)).for("update");
    if (!batch) throw new Error("Batch not found");

    const current = Number(batch.remainingQuantity);
    const amount = Math.abs(Number(input.amount));
    let quantityChange: number;
    let movementType: MovementType;

    if (input.type === "correction") {
      quantityChange = amount - current;
      movementType = "correction";
    } else if (input.type === "manual_add") {
      quantityChange = amount;
      movementType = "manual_add";
    } else {
      if (amount > current) throw new InsufficientStockError(current, amount);
      quantityChange = -amount;
      movementType = input.type === "wastage" ? "wastage" : "manual_deduct";
    }

    const newRemaining = current + quantityChange;
    await tx
      .update(stringInventoryBatches)
      .set({ remainingQuantity: newRemaining.toFixed(2), status: newRemaining > 0 ? "active" : "depleted" })
      .where(eq(stringInventoryBatches.id, batch.id));

    const [movement] = await tx
      .insert(stringInventoryMovements)
      .values({
        stringProductId: batch.stringProductId,
        batchId: batch.id,
        movementType,
        quantityChange: quantityChange.toFixed(2),
        unit: batch.unit,
        costPerUnitCentsSnapshot: batch.costPerUnitCents,
        reason: input.reason.trim(),
      })
      .returning();
    return movement;
  });
}

// -- FIFO allocation for string jobs ----------------------------------------

export interface AllocationLine {
  batchId: string;
  batchNumber: string;
  quantity: number;
  costPerUnitCents: number;
  cogsCents: number;
}

export interface FifoPlanResult {
  sufficient: boolean;
  available: number;
  plan: AllocationLine[];
}

/** Dry-run FIFO walk (no writes) — active batches for the product ordered
 * oldest purchase first, consuming each until the need is met or batches
 * run out (brief §10). Used both to preview "Required 11m, available 7.5m"
 * warnings and as the first half of allocateForJobRole below. */
async function planFifo(tx: DbOrTx, stringProductId: string, quantityNeeded: number): Promise<FifoPlanResult> {
  const batches = await tx
    .select()
    .from(stringInventoryBatches)
    .where(and(eq(stringInventoryBatches.stringProductId, stringProductId), gt(stringInventoryBatches.remainingQuantity, "0")))
    .orderBy(asc(stringInventoryBatches.purchaseDate), asc(stringInventoryBatches.createdAt))
    .for("update");

  const plan: AllocationLine[] = [];
  let remaining = quantityNeeded;
  let available = 0;
  for (const b of batches) {
    available += Number(b.remainingQuantity);
    if (remaining <= 0) continue;
    const take = Math.min(Number(b.remainingQuantity), remaining);
    if (take <= 0) continue;
    const costPerUnitCents = Number(b.costPerUnitCents);
    plan.push({ batchId: b.id, batchNumber: b.batchNumber, quantity: take, costPerUnitCents, cogsCents: Math.round(take * costPerUnitCents) });
    remaining -= take;
  }
  return { sufficient: remaining <= 0.0001, available, plan };
}

/** Preview only — used by the job form/completion UI to show a stock
 * warning before the user confirms. Never writes. */
export async function previewStock(stringProductId: string, quantityNeeded: number): Promise<{ sufficient: boolean; available: number }> {
  const { sufficient, available } = await planFifo(db, stringProductId, quantityNeeded);
  return { sufficient, available };
}

export interface AllocateForRoleParams {
  tx: DbOrTx;
  stringJobId: string;
  role: "main" | "cross";
  stringProductId: string;
  quantityNeeded: number;
  unit: StockUnit;
  allowOverride: boolean;
}

export interface AllocateForRoleResult {
  allocations: StringJobInventoryAllocation[];
  cogsCents: number;
}

/** The write half of FIFO allocation for one job/role (brief §14) — locks
 * and consumes batches oldest-first, writing one "string_job" movement and
 * one allocation row per batch touched, all inside the caller's
 * transaction so a short reel plus a top-up from the next batch either
 * both land or neither does. Throws InsufficientStockError if the plan
 * can't be satisfied and allowOverride is false — the caller (job
 * completion) rolls the whole transaction back on that, so nothing is
 * half-deducted. With allowOverride, any shortfall after exhausting every
 * active batch is taken from the single most recent batch for the
 * product, deliberately pushed negative and flagged (brief §19). */
export async function allocateForRole(params: AllocateForRoleParams): Promise<AllocateForRoleResult> {
  const { tx, stringJobId, role, stringProductId, quantityNeeded, unit, allowOverride } = params;
  const { sufficient, plan } = await planFifo(tx, stringProductId, quantityNeeded);

  let overrideLine: AllocationLine | null = null;
  if (!sufficient) {
    if (!allowOverride) throw new InsufficientStockError(plan.reduce((s, l) => s + l.quantity, 0), quantityNeeded);
    const covered = plan.reduce((s, l) => s + l.quantity, 0);
    const shortfall = quantityNeeded - covered;
    const [mostRecent] = await tx.select().from(stringInventoryBatches).where(eq(stringInventoryBatches.stringProductId, stringProductId)).orderBy(desc(stringInventoryBatches.createdAt)).limit(1);
    if (!mostRecent) throw new Error("No batches exist for this string yet — receive stock before overriding.");
    const costPerUnitCents = Number(mostRecent.costPerUnitCents);
    overrideLine = { batchId: mostRecent.id, batchNumber: mostRecent.batchNumber, quantity: shortfall, costPerUnitCents, cogsCents: Math.round(shortfall * costPerUnitCents) };
  }

  const lines = overrideLine ? mergeOverrideLine(plan, overrideLine) : plan;
  const overrideBatchId = overrideLine?.batchId ?? null;
  const allocations: StringJobInventoryAllocation[] = [];
  let cogsCents = 0;

  for (const line of lines) {
    // Flags the whole line, even if part of its quantity was genuinely
    // available — the line as a whole only exists/grew because the plan
    // came up short, so "this deduction involved an override" is accurate.
    const isOverride = line.batchId === overrideBatchId;
    const [batch] = await tx.select().from(stringInventoryBatches).where(eq(stringInventoryBatches.id, line.batchId)).for("update");
    const newRemaining = Number(batch.remainingQuantity) - line.quantity;

    await tx
      .update(stringInventoryBatches)
      .set({ remainingQuantity: newRemaining.toFixed(2), status: newRemaining > 0 ? "active" : "depleted" })
      .where(eq(stringInventoryBatches.id, batch.id));

    const [movement] = await tx
      .insert(stringInventoryMovements)
      .values({
        stringProductId,
        batchId: batch.id,
        movementType: "string_job",
        quantityChange: (-line.quantity).toFixed(2),
        unit,
        costPerUnitCentsSnapshot: batch.costPerUnitCents,
        stringJobId,
        stringJobRole: role,
        stockOverride: isOverride,
      })
      .returning();

    const roundedCogs = Math.round(line.quantity * line.costPerUnitCents);
    cogsCents += roundedCogs;

    const [allocation] = await tx
      .insert(stringJobInventoryAllocations)
      .values({
        stringJobId,
        role,
        inventoryBatchId: batch.id,
        quantityUsed: line.quantity.toFixed(2),
        costPerUnitSnapshot: batch.costPerUnitCents,
        cogsAmountCents: roundedCogs,
        movementId: movement.id,
      })
      .returning();
    allocations.push(allocation);
  }

  return { allocations, cogsCents };
}

function mergeOverrideLine(plan: AllocationLine[], overrideLine: AllocationLine): AllocationLine[] {
  const existing = plan.find((l) => l.batchId === overrideLine.batchId);
  if (!existing) return [...plan, overrideLine];
  return plan.map((l) => (l.batchId === overrideLine.batchId ? { ...l, quantity: l.quantity + overrideLine.quantity, cogsCents: l.cogsCents + overrideLine.cogsCents } : l));
}

/** Reverses every un-reversed allocation for one job/role — used both when
 * a completed job's string usage is edited (reverse, then re-allocate the
 * corrected amount) and when a completed job is un-completed/cancelled
 * (reverse only, brief §24/§25). Never deletes or rewrites the original
 * movement/allocation rows; each reversal is a new, linked ledger entry. */
export async function reverseAllocationsForRole(tx: DbOrTx, stringJobId: string, role: "main" | "cross", reason: string): Promise<void> {
  const active = await tx
    .select()
    .from(stringJobInventoryAllocations)
    .where(and(eq(stringJobInventoryAllocations.stringJobId, stringJobId), eq(stringJobInventoryAllocations.role, role), isNull(stringJobInventoryAllocations.reversedAt)));

  for (const alloc of active) {
    const [batch] = await tx.select().from(stringInventoryBatches).where(eq(stringInventoryBatches.id, alloc.inventoryBatchId)).for("update");
    if (!batch) continue;
    const newRemaining = Number(batch.remainingQuantity) + Number(alloc.quantityUsed);
    await tx.update(stringInventoryBatches).set({ remainingQuantity: newRemaining.toFixed(2), status: "active" }).where(eq(stringInventoryBatches.id, batch.id));

    await tx.insert(stringInventoryMovements).values({
      stringProductId: batch.stringProductId,
      batchId: batch.id,
      movementType: "reversal",
      quantityChange: alloc.quantityUsed,
      unit: batch.unit,
      costPerUnitCentsSnapshot: alloc.costPerUnitSnapshot,
      stringJobId,
      stringJobRole: role,
      reversesMovementId: alloc.movementId,
      reason,
    });

    await tx.update(stringJobInventoryAllocations).set({ reversedAt: new Date() }).where(eq(stringJobInventoryAllocations.id, alloc.id));
  }
}

export async function hasActiveAllocations(stringJobId: string, role: "main" | "cross"): Promise<boolean> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stringJobInventoryAllocations)
    .where(and(eq(stringJobInventoryAllocations.stringJobId, stringJobId), eq(stringJobInventoryAllocations.role, role), isNull(stringJobInventoryAllocations.reversedAt)));
  return (row?.count ?? 0) > 0;
}

export async function listAllocationsForJob(stringJobId: string): Promise<StringJobInventoryAllocation[]> {
  return db.select().from(stringJobInventoryAllocations).where(eq(stringJobInventoryAllocations.stringJobId, stringJobId));
}

// -- CSV export --------------------------------------------------------

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
}

export async function exportStringProductsCsv(): Promise<string> {
  const rows = await listStringProducts({ includeArchived: true });
  return toCsv(
    ["Brand", "Name", "Gauge", "Colour", "Material", "SKU", "Tracking unit", "Available", "Status", "Archived"],
    rows.map((r) => [r.brand, r.name, r.gauge, r.colour, r.material, r.sku, r.trackingUnit, r.available, r.status, r.archivedAt ? "yes" : "no"]),
  );
}

export async function exportBatchesCsv(): Promise<string> {
  const rows = await db
    .select({ batch: stringInventoryBatches, brand: stringProducts.brand, name: stringProducts.name })
    .from(stringInventoryBatches)
    .innerJoin(stringProducts, eq(stringProducts.id, stringInventoryBatches.stringProductId))
    .orderBy(desc(stringInventoryBatches.purchaseDate));
  return toCsv(
    ["Batch", "Product", "Purchase date", "Original qty", "Remaining qty", "Unit", "Purchase cost (cents)", "Cost per unit (cents)", "Status", "Opening stock"],
    rows.map((r) => [
      r.batch.batchNumber,
      `${r.brand} ${r.name}`,
      r.batch.purchaseDate,
      r.batch.originalQuantity,
      r.batch.remainingQuantity,
      r.batch.unit,
      r.batch.purchaseCostCents,
      r.batch.costPerUnitCents,
      r.batch.status,
      r.batch.isOpeningStock ? "yes" : "no",
    ]),
  );
}

export async function exportMovementsCsv(): Promise<string> {
  const rows = await db
    .select({ movement: stringInventoryMovements, batchNumber: stringInventoryBatches.batchNumber, brand: stringProducts.brand, name: stringProducts.name, jobCode: sql<string | null>`(select code from string_jobs where id = ${stringInventoryMovements.stringJobId})` })
    .from(stringInventoryMovements)
    .innerJoin(stringInventoryBatches, eq(stringInventoryBatches.id, stringInventoryMovements.batchId))
    .innerJoin(stringProducts, eq(stringProducts.id, stringInventoryMovements.stringProductId))
    .orderBy(desc(stringInventoryMovements.occurredAt));
  return toCsv(
    ["Date", "Product", "Batch", "Type", "Quantity change", "Unit", "Job", "Override", "Reason"],
    rows.map((r) => [
      r.movement.occurredAt.toISOString(),
      `${r.brand} ${r.name}`,
      r.batchNumber,
      r.movement.movementType,
      r.movement.quantityChange,
      r.movement.unit,
      r.jobCode,
      r.movement.stockOverride ? "yes" : "no",
      r.movement.reason,
    ]),
  );
}
