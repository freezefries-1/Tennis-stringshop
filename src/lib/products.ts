import { and, asc, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { productCategories, productInventoryBatches, productInventoryMovements, products, saleItemInventoryAllocations, suppliers } from "@/db/schema";
import { getInventoryDefaults, type InventoryDefaults } from "./settings";
import { isForeignKeyViolation } from "./db-errors";

// PRODUCT_VS_STRING_PRODUCT — referenced from src/db/schema.ts's comment on
// `products`.
//
// `string_products` (Phase 5) and `products` (Phase 6, this file) are two
// separate catalogues on purpose:
//   - A STRING PRODUCT is a type/variant of tennis string (brand + name +
//     gauge + colour), stocked in metres or sets, and is what a String Job
//     consumes. It is never duplicated into `products`.
//   - A PRODUCT (this file) is everything else SportCraft sells at retail —
//     balls, grips, overgrips, paddles, rackets, accessories, apparel — a
//     plain unit count, no gauge/colour/tracking-unit concept.
// The one place these two worlds meet is a Sale Item: selling a whole reel
// or a packaged set of a string is a `sale_items` row with
// `stringProductId` set and `productId` null, deducting the SAME
// string_inventory_batches stock a job would have consumed — never a
// second, unrelated stock count for the same physical string (brief §8–10).
// See allocateProductForSaleItem / sellStringProductRetail in
// src/lib/sales.ts for both sides of that.

export type ProductCategory = typeof productCategories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductInventoryBatch = typeof productInventoryBatches.$inferSelect;
export type ProductInventoryMovement = typeof productInventoryMovements.$inferSelect;
export type ProductMovementType = ProductInventoryMovement["movementType"];

// A DB transaction handle (postgres-js/drizzle) or the top-level db itself —
// every write helper below accepts either, same reasoning as
// string-inventory.ts's DbOrTx (sales.ts needs several of these writes to
// commit-or-fail together as one checkout).
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

// -- product categories ---------------------------------------------------

export async function listProductCategories(includeArchived = false): Promise<ProductCategory[]> {
  return db
    .select()
    .from(productCategories)
    .where(includeArchived ? undefined : isNull(productCategories.archivedAt))
    .orderBy(asc(productCategories.name));
}

export async function findCategoryByName(name: string): Promise<ProductCategory | null> {
  const [row] = await db
    .select()
    .from(productCategories)
    .where(sql`lower(${productCategories.name}) = lower(${name})`)
    .limit(1);
  return row ?? null;
}

export async function createProductCategory(name: string): Promise<ProductCategory> {
  const [row] = await db.insert(productCategories).values({ name: name.trim() }).returning();
  return row;
}

export async function renameProductCategory(id: string, name: string): Promise<ProductCategory | null> {
  const [row] = await db.update(productCategories).set({ name: name.trim() }).where(eq(productCategories.id, id)).returning();
  return row ?? null;
}

export async function setProductCategoryArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(productCategories)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(productCategories.id, id));
}

export async function deleteProductCategory(id: string): Promise<"deleted" | "in_use"> {
  try {
    await db.delete(productCategories).where(eq(productCategories.id, id));
    return "deleted";
  } catch (err) {
    if (isForeignKeyViolation(err)) return "in_use";
    throw err;
  }
}

const DEFAULT_CATEGORIES = ["Tennis String", "Tennis Balls", "Grip", "Overgrip", "Tennis Racket", "Pickleball Paddle", "Pickleballs", "Accessories", "Apparel", "Other"];

/** Seeds the starter category list (brief §3) the first time Products is
 * opened with none yet — never overwrites/duplicates if some already
 * exist, so a shop that's already renamed/archived its categories is left
 * alone. */
export async function ensureDefaultCategories(): Promise<void> {
  const existing = await db.select({ count: sql<number>`count(*)::int` }).from(productCategories);
  if ((existing[0]?.count ?? 0) > 0) return;
  await db.insert(productCategories).values(DEFAULT_CATEGORIES.map((name) => ({ name })));
}

// -- products ---------------------------------------------------------------

export interface ProductInput {
  name: string;
  brand?: string | null;
  categoryId: string;
  variant?: string | null;
  sku?: string | null;
  barcode?: string | null;
  defaultSellingPriceCents?: number | null;
  costPriceCents?: number | null;
  lowStockThreshold?: number | null;
  supplierId?: string | null;
  trackInventory: boolean;
  notes?: string | null;
}

function cleanProductInput(input: ProductInput) {
  return {
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    categoryId: input.categoryId,
    variant: input.variant?.trim() || null,
    sku: input.sku?.trim() || null,
    barcode: input.barcode?.trim() || null,
    defaultSellingPriceCents: input.defaultSellingPriceCents ?? null,
    costPriceCents: input.costPriceCents ?? null,
    lowStockThreshold: input.lowStockThreshold ?? null,
    supplierId: input.supplierId || null,
    trackInventory: input.trackInventory,
    notes: input.notes?.trim() || null,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const [row] = await db.insert(products).values(cleanProductInput(input)).returning();
  return row;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product | null> {
  const [row] = await db
    .update(products)
    .set({ ...cleanProductInput(input), updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return row ?? null;
}

export async function setProductArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(products)
    .set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() })
    .where(eq(products.id, id));
}

/** Same brand + name + variant already exists — a soft warning before
 * creating a near-duplicate (same reasoning as
 * string-inventory.ts's findDuplicateStringProduct), not a hard block. */
export async function findDuplicateProduct(name: string, brand: string | null, variant: string | null, excludeId?: string): Promise<Product | null> {
  const [row] = await db
    .select()
    .from(products)
    .where(
      and(
        isNull(products.archivedAt),
        sql`lower(${products.name}) = lower(${name})`,
        brand ? sql`lower(${products.brand}) = lower(${brand})` : sql`${products.brand} is null`,
        variant ? sql`lower(${products.variant}) = lower(${variant})` : sql`${products.variant} is null`,
        excludeId ? sql`${products.id} != ${excludeId}` : sql`true`,
      ),
    )
    .limit(1);
  return row ?? null;
}

/** True, permanent deletion — reserved for a mistaken entry. Blocked by
 * Postgres if any batch/movement/sale item still references the product;
 * archiving is the everyday path. */
export async function deleteProduct(id: string): Promise<"deleted" | "in_use"> {
  try {
    await db.delete(products).where(eq(products.id, id));
    return "deleted";
  } catch (err) {
    if (isForeignKeyViolation(err)) return "in_use";
    throw err;
  }
}

export interface StockSummary {
  available: number;
  activeBatches: number;
  status: "in_stock" | "low_stock" | "out_of_stock" | "not_tracked";
}

async function stockSummaries(productIds: string[]): Promise<Map<string, { available: number; activeBatches: number; avgCostPerUnitCents: number | null }>> {
  const map = new Map<string, { available: number; activeBatches: number; avgCostPerUnitCents: number | null }>();
  if (productIds.length === 0) return map;
  const rows = await db
    .select({
      productId: productInventoryBatches.productId,
      available: sql<number>`coalesce(sum(${productInventoryBatches.remainingQuantity}), 0)::int`,
      activeBatches: sql<number>`count(*) filter (where ${productInventoryBatches.remainingQuantity} > 0)::int`,
      value: sql<string>`coalesce(sum(${productInventoryBatches.remainingQuantity} * ${productInventoryBatches.costPerUnitCents}), 0)`,
    })
    .from(productInventoryBatches)
    .where(inArray(productInventoryBatches.productId, productIds))
    .groupBy(productInventoryBatches.productId);
  for (const r of rows) {
    const avgCostPerUnitCents = r.available > 0 ? Number(r.value) / r.available : null;
    map.set(r.productId, { available: r.available, activeBatches: r.activeBatches, avgCostPerUnitCents });
  }
  return map;
}

function stockStatus(trackInventory: boolean, available: number, threshold: number): StockSummary["status"] {
  if (!trackInventory) return "not_tracked";
  if (available <= 0) return "out_of_stock";
  if (available <= threshold) return "low_stock";
  return "in_stock";
}

export interface ProductRow extends Product {
  categoryName: string;
  available: number;
  activeBatches: number;
  status: StockSummary["status"];
  effectiveThreshold: number;
  avgCostPerUnitCents: number | null;
}

export interface ProductFilters {
  query?: string;
  categoryId?: string;
  status?: "in_stock" | "low_stock" | "out_of_stock";
  includeArchived?: boolean;
}

/** Browse/search the retail catalogue — the main Products page. Fetched in
 * full and filtered client-side, same pattern as every other list in this
 * app at the scale a single-shop business runs at. */
export async function listProducts(filters: ProductFilters = {}): Promise<ProductRow[]> {
  const q = filters.query?.trim();
  const like = q ? `%${q}%` : null;

  const rows = await db
    .select({ product: products, categoryName: productCategories.name })
    .from(products)
    .innerJoin(productCategories, eq(productCategories.id, products.categoryId))
    .where(
      and(
        filters.includeArchived ? sql`true` : isNull(products.archivedAt),
        filters.categoryId ? eq(products.categoryId, filters.categoryId) : sql`true`,
        like
          ? sql`(${products.name} ilike ${like} or ${products.brand} ilike ${like} or ${products.variant} ilike ${like} or ${products.sku} ilike ${like} or ${products.barcode} ilike ${like} or ${productCategories.name} ilike ${like})`
          : sql`true`,
      ),
    )
    .orderBy(asc(products.name), asc(products.brand));

  const defaults = await getInventoryDefaults();
  const summaries = await stockSummaries(rows.map((r) => r.product.id));

  const withStock = rows.map((r) => {
    const s = summaries.get(r.product.id) ?? { available: 0, activeBatches: 0, avgCostPerUnitCents: null };
    const threshold = r.product.lowStockThreshold ?? defaults.lowStockThresholdUnits;
    return {
      ...r.product,
      categoryName: r.categoryName,
      available: s.available,
      activeBatches: s.activeBatches,
      status: stockStatus(r.product.trackInventory, s.available, threshold),
      effectiveThreshold: threshold,
      avgCostPerUnitCents: s.avgCostPerUnitCents,
    };
  });

  return filters.status ? withStock.filter((r) => r.status === filters.status) : withStock;
}

export async function getProduct(id: string): Promise<ProductRow | null> {
  const rows = await listProducts({ includeArchived: true });
  return rows.find((r) => r.id === id) ?? null;
}

/** For the POS/job product picker — active, tracked-or-not, with live stock
 * so the picker can show "8 available" without exposing cost, same
 * reasoning as string-inventory.ts's searchStringProductsForPicker. */
export async function searchProductsForPicker(query: string): Promise<(ProductRow & { label: string })[]> {
  const rows = await listProducts({ query, includeArchived: false });
  return rows.map((r) => ({ ...r, label: [r.brand, r.name, r.variant].filter(Boolean).join(" ") }));
}

export interface InventorySummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValueCents: number;
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const rows = await listProducts({});
  const [valueRow] = await db
    .select({ value: sql<string>`coalesce(sum(${productInventoryBatches.remainingQuantity} * ${productInventoryBatches.costPerUnitCents}), 0)` })
    .from(productInventoryBatches);
  return {
    totalProducts: rows.length,
    lowStockCount: rows.filter((r) => r.status === "low_stock").length,
    outOfStockCount: rows.filter((r) => r.status === "out_of_stock").length,
    inventoryValueCents: Math.round(Number(valueRow?.value ?? 0) / 100),
  };
}

export interface LowStockRow {
  productId: string;
  label: string;
  available: number;
  threshold: number;
  status: "low_stock" | "out_of_stock";
}

/** Dashboard/summary-card version — filters and limits in SQL rather than
 * fetching every product (as the old implementation did, via listProducts)
 * and filtering in JS. listProducts stays as-is for the /products list
 * page, which genuinely needs every row for client-side search/filter at
 * this app's scale; this one only ever needs a handful of rows. */
export async function listLowStockProducts(limit = 8, defaults?: InventoryDefaults): Promise<LowStockRow[]> {
  const d = defaults ?? (await getInventoryDefaults());
  const rows = await db
    .select({
      id: products.id,
      brand: products.brand,
      name: products.name,
      variant: products.variant,
      threshold: sql<number>`coalesce(${products.lowStockThreshold}, ${d.lowStockThresholdUnits})::int`,
      available: sql<number>`coalesce(sum(${productInventoryBatches.remainingQuantity}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0)::int`,
    })
    .from(products)
    .leftJoin(productInventoryBatches, eq(productInventoryBatches.productId, products.id))
    .where(and(isNull(products.archivedAt), eq(products.trackInventory, true)))
    .groupBy(products.id, products.brand, products.name, products.variant, products.lowStockThreshold)
    .having(sql`coalesce(sum(${productInventoryBatches.remainingQuantity}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0) <= coalesce(${products.lowStockThreshold}, ${d.lowStockThresholdUnits})`)
    .orderBy(sql`coalesce(sum(${productInventoryBatches.remainingQuantity}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0) asc`, asc(products.name), asc(products.brand))
    .limit(limit);

  return rows.map((r) => ({
    productId: r.id,
    label: [r.brand, r.name, r.variant].filter(Boolean).join(" "),
    available: r.available,
    threshold: r.threshold,
    status: r.available <= 0 ? "out_of_stock" : "low_stock",
  }));
}

// -- receiving stock -------------------------------------------------------

export interface ReceiveProductStockInput {
  productId: string;
  supplierId?: string | null;
  purchaseDate: string;
  purchaseCostCents: number;
  quantity: number;
  supplierReference?: string | null;
  notes?: string | null;
  isOpeningStock?: boolean;
}

/** Creates the batch and its "received" movement together — never just a
 * raw quantity bump. Same reasoning as string-inventory.ts's receiveStock:
 * cost-per-unit is derived once, here, and frozen onto the batch. */
export async function receiveProductStock(input: ReceiveProductStockInput): Promise<{ batch: ProductInventoryBatch; movement: ProductInventoryMovement }> {
  const costPerUnitCents = input.quantity > 0 ? input.purchaseCostCents / input.quantity : 0;

  return db.transaction(async (tx) => {
    const [batch] = await tx
      .insert(productInventoryBatches)
      .values({
        productId: input.productId,
        supplierId: input.supplierId || null,
        purchaseDate: input.purchaseDate,
        purchaseCostCents: input.purchaseCostCents,
        originalQuantity: input.quantity,
        remainingQuantity: input.quantity,
        costPerUnitCents: costPerUnitCents.toFixed(4),
        supplierReference: input.supplierReference?.trim() || null,
        notes: input.notes?.trim() || null,
        isOpeningStock: input.isOpeningStock ?? false,
      })
      .returning();

    const [movement] = await tx
      .insert(productInventoryMovements)
      .values({
        productId: input.productId,
        batchId: batch.id,
        movementType: "received",
        quantityChange: input.quantity,
        costPerUnitCentsSnapshot: batch.costPerUnitCents,
        reason: input.isOpeningStock ? "Opening inventory" : null,
      })
      .returning();

    return { batch, movement };
  });
}

// -- batches / movements (reads) -------------------------------------------

export interface ProductBatchRow extends ProductInventoryBatch {
  supplierName: string | null;
}

export async function listBatchesForProduct(productId: string): Promise<ProductBatchRow[]> {
  const rows = await db
    .select({ batch: productInventoryBatches, supplierName: suppliers.name })
    .from(productInventoryBatches)
    .leftJoin(suppliers, eq(suppliers.id, productInventoryBatches.supplierId))
    .where(eq(productInventoryBatches.productId, productId))
    .orderBy(asc(productInventoryBatches.purchaseDate), asc(productInventoryBatches.createdAt));
  return rows.map((r) => ({ ...r.batch, supplierName: r.supplierName }));
}

export async function getProductBatch(id: string): Promise<ProductInventoryBatch | null> {
  const [row] = await db.select().from(productInventoryBatches).where(eq(productInventoryBatches.id, id)).limit(1);
  return row ?? null;
}

export interface ProductMovementRow extends ProductInventoryMovement {
  batchNumber: string;
  saleCode: string | null;
}

export async function listMovementsForProduct(productId: string, limit = 100): Promise<ProductMovementRow[]> {
  const rows = await db
    .select({
      movement: productInventoryMovements,
      batchNumber: productInventoryBatches.batchNumber,
      saleCode: sql<string | null>`(select code from sales where id = ${productInventoryMovements.saleId})`,
    })
    .from(productInventoryMovements)
    .innerJoin(productInventoryBatches, eq(productInventoryBatches.id, productInventoryMovements.batchId))
    .where(eq(productInventoryMovements.productId, productId))
    .orderBy(desc(productInventoryMovements.occurredAt))
    .limit(limit);
  return rows.map((r) => ({ ...r.movement, batchNumber: r.batchNumber, saleCode: r.saleCode }));
}

export interface RecentProductMovementRow extends ProductMovementRow {
  productLabel: string;
}

/** Dashboard's "Recent inventory movements" widget, retail side. */
export async function listRecentProductMovements(limit = 8): Promise<RecentProductMovementRow[]> {
  const rows = await db
    .select({
      movement: productInventoryMovements,
      batchNumber: productInventoryBatches.batchNumber,
      saleCode: sql<string | null>`(select code from sales where id = ${productInventoryMovements.saleId})`,
      name: products.name,
      brand: products.brand,
      variant: products.variant,
    })
    .from(productInventoryMovements)
    .innerJoin(productInventoryBatches, eq(productInventoryBatches.id, productInventoryMovements.batchId))
    .innerJoin(products, eq(products.id, productInventoryMovements.productId))
    .orderBy(desc(productInventoryMovements.occurredAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r.movement,
    batchNumber: r.batchNumber,
    saleCode: r.saleCode,
    productLabel: [r.brand, r.name, r.variant].filter(Boolean).join(" "),
  }));
}

// -- manual adjustments (add / deduct / wastage / correction) --------------

export interface ManualAdjustmentInput {
  batchId: string;
  type: "manual_add" | "manual_deduct" | "wastage" | "correction";
  amount: number;
  reason: string;
}

export class InsufficientStockError extends Error {
  constructor(public available: number, public needed: number) {
    super(`Only ${available} available, ${needed} needed`);
  }
}

export async function recordManualAdjustment(input: ManualAdjustmentInput): Promise<ProductInventoryMovement> {
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(productInventoryBatches).where(eq(productInventoryBatches.id, input.batchId)).for("update");
    if (!batch) throw new Error("Batch not found");

    const current = batch.remainingQuantity;
    const amount = Math.abs(Math.round(input.amount));
    let quantityChange: number;
    let movementType: ProductMovementType;

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
      .update(productInventoryBatches)
      .set({ remainingQuantity: newRemaining, status: newRemaining > 0 ? "active" : "depleted" })
      .where(eq(productInventoryBatches.id, batch.id));

    const [movement] = await tx
      .insert(productInventoryMovements)
      .values({
        productId: batch.productId,
        batchId: batch.id,
        movementType,
        quantityChange,
        costPerUnitCentsSnapshot: batch.costPerUnitCents,
        reason: input.reason.trim(),
      })
      .returning();
    return movement;
  });
}

export interface UpdateProductBatchCostInput {
  batchId: string;
  purchaseCostCents: number;
  /** Optional correction to how many units this batch actually received
   * (e.g. the receipt itself was mis-entered — "20" typed instead of "10").
   * Distinct from a Stock correction (which only ever adjusts remaining
   * quantity, because finding/losing/miscounting stock never changes what
   * you originally paid per unit): this corrects the RECEIPT itself, so
   * cost-per-unit recomputes from it. remainingQuantity shifts by the same
   * delta as originalQuantity, so units already sold/used from this batch
   * stay correctly accounted for — e.g. 20 received, 15 remaining (5 sold),
   * corrected to 10 received -> 5 remaining, same 5 sold. Omitted/unchanged
   * means only the cost is being corrected, matching the old behavior. */
  originalQuantity?: number;
  reason: string;
}

/** Thrown when a received-quantity correction would imply fewer units were
 * ever received than have already been sold/used from this batch — the
 * correction itself must be wrong, not just applied and clamped. */
export class BatchQuantityCorrectionError extends Error {
  constructor(public impliedRemaining: number) {
    super(`This correction would leave ${impliedRemaining} units remaining, which isn't possible — some have already been sold or used from this batch.`);
  }
}

/** Same reasoning as string-inventory.ts's updateBatchCost — recalculates
 * cost-per-unit from the batch's (possibly now-corrected) original
 * quantity and only affects allocations made from this point on; a sale
 * already completed against this batch keeps its own
 * costPerUnitSnapshot/cogsAmountCents exactly as they were. */
export async function updateProductBatchCost(input: UpdateProductBatchCostInput): Promise<ProductInventoryBatch> {
  return db.transaction(async (tx) => {
    const [batch] = await tx.select().from(productInventoryBatches).where(eq(productInventoryBatches.id, input.batchId)).for("update");
    if (!batch) throw new Error("Batch not found");

    const newOriginalQuantity = input.originalQuantity ?? batch.originalQuantity;
    if (newOriginalQuantity <= 0) throw new Error("Original quantity must be greater than zero.");
    const quantityDelta = newOriginalQuantity - batch.originalQuantity;
    const newRemainingQuantity = batch.remainingQuantity + quantityDelta;
    if (newRemainingQuantity < 0) throw new BatchQuantityCorrectionError(newRemainingQuantity);

    const newCostPerUnitCents = newOriginalQuantity > 0 ? input.purchaseCostCents / newOriginalQuantity : 0;
    const oldDollars = (batch.purchaseCostCents / 100).toFixed(2);
    const newDollars = (input.purchaseCostCents / 100).toFixed(2);
    const quantityNote = quantityDelta !== 0 ? ` Received quantity corrected: ${batch.originalQuantity} → ${newOriginalQuantity}.` : "";

    const [updated] = await tx
      .update(productInventoryBatches)
      .set({
        purchaseCostCents: input.purchaseCostCents,
        originalQuantity: newOriginalQuantity,
        remainingQuantity: newRemainingQuantity,
        costPerUnitCents: newCostPerUnitCents.toFixed(4),
        status: newRemainingQuantity > 0 ? "active" : "depleted",
      })
      .where(eq(productInventoryBatches.id, batch.id))
      .returning();

    await tx.insert(productInventoryMovements).values({
      productId: batch.productId,
      batchId: batch.id,
      movementType: "correction",
      quantityChange: quantityDelta,
      costPerUnitCentsSnapshot: newCostPerUnitCents.toFixed(4),
      reason: `Purchase cost corrected: $${oldDollars} → $${newDollars}.${quantityNote} ${input.reason.trim()}`,
    });

    return updated;
  });
}

// -- FIFO allocation for sale items ------------------------------------------

export interface ProductAllocationLine {
  batchId: string;
  batchNumber: string;
  quantity: number;
  costPerUnitCents: number;
  cogsCents: number;
}

export interface ProductFifoPlanResult {
  sufficient: boolean;
  available: number;
  plan: ProductAllocationLine[];
}

/** Dry-run FIFO walk (no writes) — active batches for the product ordered
 * oldest purchase first. Same shape as string-inventory.ts's planFifo. */
async function planFifo(tx: DbOrTx, productId: string, quantityNeeded: number): Promise<ProductFifoPlanResult> {
  const batches = await tx
    .select()
    .from(productInventoryBatches)
    .where(and(eq(productInventoryBatches.productId, productId), gt(productInventoryBatches.remainingQuantity, 0)))
    .orderBy(asc(productInventoryBatches.purchaseDate), asc(productInventoryBatches.createdAt))
    .for("update");

  const plan: ProductAllocationLine[] = [];
  let remaining = quantityNeeded;
  let available = 0;
  for (const b of batches) {
    available += b.remainingQuantity;
    if (remaining <= 0) continue;
    const take = Math.min(b.remainingQuantity, remaining);
    if (take <= 0) continue;
    const costPerUnitCents = Number(b.costPerUnitCents);
    plan.push({ batchId: b.id, batchNumber: b.batchNumber, quantity: take, costPerUnitCents, cogsCents: Math.round(take * costPerUnitCents) });
    remaining -= take;
  }
  return { sufficient: remaining <= 0, available, plan };
}

/** Preview only — used by the POS/job-product-add UI to show a stock
 * warning before the user confirms. Never writes. */
export async function previewProductStock(productId: string, quantityNeeded: number): Promise<{ sufficient: boolean; available: number }> {
  const { sufficient, available } = await planFifo(db, productId, quantityNeeded);
  return { sufficient, available };
}

export interface AllocateForSaleItemParams {
  tx: DbOrTx;
  productId: string;
  saleItemId: string;
  quantityNeeded: number;
  allowOverride: boolean;
  movementType?: ProductMovementType;
  saleId?: string | null;
}

export type SaleItemInventoryAllocation = typeof saleItemInventoryAllocations.$inferSelect;

export interface AllocateForSaleItemResult {
  cogsCents: number;
  allocations: SaleItemInventoryAllocation[];
}

/** The write half of FIFO allocation for one retail sale item — locks and
 * consumes batches oldest-first, writing one "sale" movement and one
 * allocation row per batch touched, all inside the caller's transaction
 * (brief §50: sale creation, inventory deduction and COGS allocation must
 * commit or fail together). Same override behaviour as
 * string-inventory.ts's allocateForRole: with allowOverride, a shortfall
 * after exhausting every active batch is taken from the most recent batch,
 * pushed negative and flagged (brief §49). */
export async function allocateProductForSaleItem(params: AllocateForSaleItemParams): Promise<AllocateForSaleItemResult> {
  const { tx, productId, saleItemId, quantityNeeded, allowOverride, saleId } = params;
  const movementType = params.movementType ?? "sale";
  const { sufficient, plan } = await planFifo(tx, productId, quantityNeeded);

  let overrideLine: ProductAllocationLine | null = null;
  if (!sufficient) {
    if (!allowOverride) throw new InsufficientStockError(plan.reduce((s, l) => s + l.quantity, 0), quantityNeeded);
    const covered = plan.reduce((s, l) => s + l.quantity, 0);
    const shortfall = quantityNeeded - covered;
    const [mostRecent] = await tx.select().from(productInventoryBatches).where(eq(productInventoryBatches.productId, productId)).orderBy(desc(productInventoryBatches.createdAt)).limit(1);
    if (!mostRecent) throw new Error("No batches exist for this product yet — receive stock before overriding.");
    const costPerUnitCents = Number(mostRecent.costPerUnitCents);
    overrideLine = { batchId: mostRecent.id, batchNumber: mostRecent.batchNumber, quantity: shortfall, costPerUnitCents, cogsCents: Math.round(shortfall * costPerUnitCents) };
  }

  const lines = overrideLine ? mergeOverrideLine(plan, overrideLine) : plan;
  const overrideBatchId = overrideLine?.batchId ?? null;
  const allocations: SaleItemInventoryAllocation[] = [];
  let cogsCents = 0;

  for (const line of lines) {
    const isOverride = line.batchId === overrideBatchId;
    const [batch] = await tx.select().from(productInventoryBatches).where(eq(productInventoryBatches.id, line.batchId)).for("update");
    const newRemaining = batch.remainingQuantity - line.quantity;

    await tx
      .update(productInventoryBatches)
      .set({ remainingQuantity: newRemaining, status: newRemaining > 0 ? "active" : "depleted" })
      .where(eq(productInventoryBatches.id, batch.id));

    const [movement] = await tx
      .insert(productInventoryMovements)
      .values({
        productId,
        batchId: batch.id,
        movementType,
        quantityChange: -line.quantity,
        costPerUnitCentsSnapshot: batch.costPerUnitCents,
        saleId: saleId ?? null,
        saleItemId,
        stockOverride: isOverride,
      })
      .returning();

    const roundedCogs = Math.round(line.quantity * line.costPerUnitCents);
    cogsCents += roundedCogs;

    const [allocation] = await tx
      .insert(saleItemInventoryAllocations)
      .values({
        saleItemId,
        inventoryBatchId: batch.id,
        quantityUsed: line.quantity,
        costPerUnitSnapshot: batch.costPerUnitCents,
        cogsAmountCents: roundedCogs,
        movementId: movement.id,
      })
      .returning();
    allocations.push(allocation);
  }

  return { cogsCents, allocations };
}

/** Reverses every un-reversed allocation for one sale item — used both when
 * a sale is cancelled and when a return restocks a returned quantity. Never
 * deletes/rewrites the original movement/allocation rows; each reversal is
 * a new, linked ledger entry (same philosophy as
 * string-inventory.ts's reverseAllocationsForRole). Reversing only a
 * PORTION of an allocation's quantity (a partial return) reverses that
 * allocation's own quantityUsed proportionally and marks it reversed only
 * once nothing of it remains to reverse again. */
export async function reverseAllocationsForSaleItem(tx: DbOrTx, saleItemId: string, quantityToReverse: number, reason: string, movementType: ProductMovementType = "reversal"): Promise<number> {
  const active = await tx
    .select()
    .from(saleItemInventoryAllocations)
    .where(and(eq(saleItemInventoryAllocations.saleItemId, saleItemId), isNull(saleItemInventoryAllocations.reversedAt)))
    .orderBy(desc(saleItemInventoryAllocations.createdAt));

  let remaining = quantityToReverse;
  let cogsReversedCents = 0;

  for (const alloc of active) {
    if (remaining <= 0) break;
    const take = Math.min(alloc.quantityUsed, remaining);
    if (take <= 0) continue;

    const [batch] = await tx.select().from(productInventoryBatches).where(eq(productInventoryBatches.id, alloc.inventoryBatchId)).for("update");
    if (!batch) continue;

    if (movementType !== "return_no_restock") {
      const newRemaining = batch.remainingQuantity + take;
      await tx.update(productInventoryBatches).set({ remainingQuantity: newRemaining, status: "active" }).where(eq(productInventoryBatches.id, batch.id));
    }

    await tx.insert(productInventoryMovements).values({
      productId: batch.productId,
      batchId: batch.id,
      movementType,
      quantityChange: movementType === "return_no_restock" ? 0 : take,
      costPerUnitCentsSnapshot: alloc.costPerUnitSnapshot,
      saleItemId,
      reversesMovementId: alloc.movementId,
      reason,
    });

    const takenCogsCents = Math.round(take * Number(alloc.costPerUnitSnapshot));
    cogsReversedCents += takenCogsCents;

    if (take >= alloc.quantityUsed) {
      await tx.update(saleItemInventoryAllocations).set({ reversedAt: new Date() }).where(eq(saleItemInventoryAllocations.id, alloc.id));
    } else {
      // Partial reversal — split this allocation: shrink it to what's left
      // un-reversed, and record a separate, already-reversed row for the
      // portion just given back, so the batch/allocation trail still adds
      // up exactly (brief §34: partial returns adjust COGS proportionally).
      await tx.update(saleItemInventoryAllocations).set({ quantityUsed: alloc.quantityUsed - take }).where(eq(saleItemInventoryAllocations.id, alloc.id));
      await tx.insert(saleItemInventoryAllocations).values({
        saleItemId,
        inventoryBatchId: alloc.inventoryBatchId,
        quantityUsed: take,
        costPerUnitSnapshot: alloc.costPerUnitSnapshot,
        cogsAmountCents: takenCogsCents,
        movementId: alloc.movementId,
        reversedAt: new Date(),
      });
    }

    remaining -= take;
  }

  return cogsReversedCents;
}

function mergeOverrideLine(plan: ProductAllocationLine[], overrideLine: ProductAllocationLine): ProductAllocationLine[] {
  const existing = plan.find((l) => l.batchId === overrideLine.batchId);
  if (!existing) return [...plan, overrideLine];
  return plan.map((l) => (l.batchId === overrideLine.batchId ? { ...l, quantity: l.quantity + overrideLine.quantity, cogsCents: l.cogsCents + overrideLine.cogsCents } : l));
}

// -- CSV export --------------------------------------------------------

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  return [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
}

export async function exportProductsCsv(): Promise<string> {
  const rows = await listProducts({ includeArchived: true });
  return toCsv(
    ["Code", "Brand", "Name", "Variant", "Category", "SKU", "Barcode", "Available", "Status", "Archived"],
    rows.map((r) => [r.code, r.brand, r.name, r.variant, r.categoryName, r.sku, r.barcode, r.trackInventory ? r.available : "n/a", r.status, r.archivedAt ? "yes" : "no"]),
  );
}

export async function exportProductBatchesCsv(): Promise<string> {
  const rows = await db
    .select({ batch: productInventoryBatches, name: products.name, brand: products.brand })
    .from(productInventoryBatches)
    .innerJoin(products, eq(products.id, productInventoryBatches.productId))
    .orderBy(desc(productInventoryBatches.purchaseDate));
  return toCsv(
    ["Batch", "Product", "Purchase date", "Original qty", "Remaining qty", "Purchase cost (cents)", "Cost per unit (cents)", "Status", "Opening stock"],
    rows.map((r) => [
      r.batch.batchNumber,
      `${r.brand ?? ""} ${r.name}`.trim(),
      r.batch.purchaseDate,
      r.batch.originalQuantity,
      r.batch.remainingQuantity,
      r.batch.purchaseCostCents,
      r.batch.costPerUnitCents,
      r.batch.status,
      r.batch.isOpeningStock ? "yes" : "no",
    ]),
  );
}

export async function exportProductMovementsCsv(): Promise<string> {
  const rows = await db
    .select({ movement: productInventoryMovements, batchNumber: productInventoryBatches.batchNumber, name: products.name, brand: products.brand, saleCode: sql<string | null>`(select code from sales where id = ${productInventoryMovements.saleId})` })
    .from(productInventoryMovements)
    .innerJoin(productInventoryBatches, eq(productInventoryBatches.id, productInventoryMovements.batchId))
    .innerJoin(products, eq(products.id, productInventoryMovements.productId))
    .orderBy(desc(productInventoryMovements.occurredAt));
  return toCsv(
    ["Date", "Product", "Batch", "Type", "Quantity change", "Sale", "Override", "Reason"],
    rows.map((r) => [r.movement.occurredAt.toISOString(), `${r.brand ?? ""} ${r.name}`.trim(), r.batchNumber, r.movement.movementType, r.movement.quantityChange, r.saleCode, r.movement.stockOverride ? "yes" : "no", r.movement.reason]),
  );
}
