// Phase 8 — Reports → Inventory. Combines high-level String + Retail
// figures for one screen WITHOUT merging the underlying tables (Phase 8
// §27) — every query below still goes through its own string_* or
// product_* tables separately; only the numbers are shown side by side.
// Current stock/value always comes from remaining batch quantities × their
// actual cost basis (FIFO), never selling price or latest purchase price
// (Phase 8 §28/§52) — reuses getInventorySummary from products.ts/
// string-inventory.ts, the same functions the /inventory and /products
// pages already call, so this report can't disagree with them.
//
// Movement/consumption figures (§29/§30/§31) use the append-only movement
// LEDGERS (string_inventory_movements / product_inventory_movements) —
// unlike current-stock, "how much moved in the last N days" has no other
// running total anywhere, so the ledger is the only correct source, exactly
// as AGENTS.md's guidance intends (avoid reconstructing history only for
// CURRENT value, which batches already answer).

import { and, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productInventoryBatches, productInventoryMovements, stringInventoryBatches, stringInventoryMovements, stringProducts } from "@/db/schema";
import { toCsv } from "./csv";
import { getInventorySummary as getProductInventorySummary } from "./products";
import { getInventorySummary as getStringInventorySummary } from "./string-inventory";

// NOTE on units: getInventorySummary() (products.ts / string-inventory.ts)
// returns its inventoryValueCents field pre-divided by 100 — despite the
// name, it actually holds whole DOLLARS, correct only because its one
// existing caller (/inventory's formatMoney0, which does NOT divide again)
// happens to expect that. Left as-is rather than touched (out of scope for
// this phase). This overview composes those same functions directly, so
// its fields are honestly named *ValueDollars and must be displayed with
// formatMoney0, never formatCents — unlike every OTHER money field this
// phase adds fresh (product/string inventory value, all genuine integer
// cents paired with formatCents, per the schema's actual convention).
export interface InventoryValueOverview {
  totalValueDollars: number;
  stringValueDollars: number;
  retailValueDollars: number;
  totalLowStock: number;
  totalOutOfStock: number;
  stringLowStock: number;
  stringOutOfStock: number;
  retailLowStock: number;
  retailOutOfStock: number;
}

export async function getInventoryValueOverview(): Promise<InventoryValueOverview> {
  const [stringSummary, retailSummary] = await Promise.all([getStringInventorySummary(), getProductInventorySummary()]);
  return {
    totalValueDollars: stringSummary.inventoryValueCents + retailSummary.inventoryValueCents,
    stringValueDollars: stringSummary.inventoryValueCents,
    retailValueDollars: retailSummary.inventoryValueCents,
    totalLowStock: stringSummary.lowStockCount + retailSummary.lowStockCount,
    totalOutOfStock: stringSummary.outOfStockCount + retailSummary.outOfStockCount,
    stringLowStock: stringSummary.lowStockCount,
    stringOutOfStock: stringSummary.outOfStockCount,
    retailLowStock: retailSummary.lowStockCount,
    retailOutOfStock: retailSummary.outOfStockCount,
  };
}

// -- movement (last 30 / 90 days) --------------------------------------

export interface StringMovementRow {
  stringProductId: string;
  brand: string;
  name: string;
  gauge: string | null;
  colour: string | null;
  trackingUnit: "m" | "set";
  currentStock: string;
  consumed30d: number;
  consumed90d: number;
  lastMovementAt: Date | null;
  daysSinceMovement: number | null;
}

const CONSUMING_STRING_TYPES = ["string_job", "retail_sale"] as const;

export async function listStringMovement(): Promise<StringMovementRow[]> {
  const [movementRows, stockRows] = await Promise.all([
    db
      .select({
        stringProductId: stringInventoryMovements.stringProductId,
        consumed30: sql<string>`coalesce(-sum(${stringInventoryMovements.quantityChange}) filter (where ${stringInventoryMovements.movementType} in ('string_job','retail_sale') and ${stringInventoryMovements.occurredAt} >= now() - interval '30 days'), 0)`,
        consumed90: sql<string>`coalesce(-sum(${stringInventoryMovements.quantityChange}) filter (where ${stringInventoryMovements.movementType} in ('string_job','retail_sale') and ${stringInventoryMovements.occurredAt} >= now() - interval '90 days'), 0)`,
        lastMovement: sql<Date | null>`max(${stringInventoryMovements.occurredAt}) filter (where ${stringInventoryMovements.movementType} in ('string_job','retail_sale'))`,
      })
      .from(stringInventoryMovements)
      .where(inArray(stringInventoryMovements.movementType, CONSUMING_STRING_TYPES))
      .groupBy(stringInventoryMovements.stringProductId),
    db
      .select({
        id: stringProducts.id,
        brand: stringProducts.brand,
        name: stringProducts.name,
        gauge: stringProducts.gauge,
        colour: stringProducts.colour,
        trackingUnit: stringProducts.trackingUnit,
        currentStock: sql<string>`coalesce(sum(${stringInventoryBatches.remainingQuantity}) filter (where ${stringInventoryBatches.remainingQuantity} > 0), 0)`,
      })
      .from(stringProducts)
      .leftJoin(stringInventoryBatches, eq(stringInventoryBatches.stringProductId, stringProducts.id))
      .where(isNull(stringProducts.archivedAt))
      .groupBy(stringProducts.id, stringProducts.brand, stringProducts.name, stringProducts.gauge, stringProducts.colour, stringProducts.trackingUnit),
  ]);

  const movementMap = new Map(movementRows.map((r) => [r.stringProductId, r]));
  const now = Date.now();
  return stockRows.map((s) => {
    const m = movementMap.get(s.id);
    const lastMovementAt = m?.lastMovement ?? null;
    return {
      stringProductId: s.id,
      brand: s.brand,
      name: s.name,
      gauge: s.gauge,
      colour: s.colour,
      trackingUnit: s.trackingUnit,
      currentStock: Number(s.currentStock).toFixed(2),
      consumed30d: Number(m?.consumed30 ?? 0),
      consumed90d: Number(m?.consumed90 ?? 0),
      lastMovementAt,
      daysSinceMovement: lastMovementAt ? Math.floor((now - new Date(lastMovementAt).getTime()) / 86400000) : null,
    };
  });
}

export interface ProductMovementRow {
  productId: string;
  code: string;
  name: string;
  brand: string | null;
  variant: string | null;
  currentStock: number;
  unitsSold30d: number;
  unitsSold90d: number;
  lastMovementAt: Date | null;
  daysSinceMovement: number | null;
}

export async function listProductMovement(): Promise<ProductMovementRow[]> {
  const [movementRows, stockRows] = await Promise.all([
    db
      .select({
        productId: productInventoryMovements.productId,
        sold30: sql<string>`coalesce(-sum(${productInventoryMovements.quantityChange}) filter (where ${productInventoryMovements.movementType} = 'sale' and ${productInventoryMovements.occurredAt} >= now() - interval '30 days'), 0)`,
        sold90: sql<string>`coalesce(-sum(${productInventoryMovements.quantityChange}) filter (where ${productInventoryMovements.movementType} = 'sale' and ${productInventoryMovements.occurredAt} >= now() - interval '90 days'), 0)`,
        lastMovement: sql<Date | null>`max(${productInventoryMovements.occurredAt}) filter (where ${productInventoryMovements.movementType} = 'sale')`,
      })
      .from(productInventoryMovements)
      .where(eq(productInventoryMovements.movementType, "sale"))
      .groupBy(productInventoryMovements.productId),
    db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        brand: products.brand,
        variant: products.variant,
        currentStock: sql<number>`coalesce(sum(${productInventoryBatches.remainingQuantity}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0)::int`,
      })
      .from(products)
      .leftJoin(productInventoryBatches, eq(productInventoryBatches.productId, products.id))
      .where(and(isNull(products.archivedAt), eq(products.trackInventory, true)))
      .groupBy(products.id, products.code, products.name, products.brand, products.variant),
  ]);

  const movementMap = new Map(movementRows.map((r) => [r.productId, r]));
  const now = Date.now();
  return stockRows.map((s) => {
    const m = movementMap.get(s.id);
    const lastMovementAt = m?.lastMovement ?? null;
    return {
      productId: s.id,
      code: s.code,
      name: s.name,
      brand: s.brand,
      variant: s.variant,
      currentStock: s.currentStock,
      unitsSold30d: Number(m?.sold30 ?? 0),
      unitsSold90d: Number(m?.sold90 ?? 0),
      lastMovementAt,
      daysSinceMovement: lastMovementAt ? Math.floor((now - new Date(lastMovementAt).getTime()) / 86400000) : null,
    };
  });
}

// -- stock cover (Phase 8 §30) -----------------------------------------
//
// Only computed where 90-day consumption is actually > 0 — never divides
// by zero, never estimates cover from a single sale or from no history at
// all (Phase 8 §30: "Do not calculate this when usage history is
// insufficient or zero"). Always labeled an estimate.

export interface StockCoverRow {
  label: string;
  currentStock: number;
  avgMonthlyConsumption: number;
  estimatedMonthsCover: number;
}

export async function getStockCoverEstimates(): Promise<{ strings: StockCoverRow[]; products: StockCoverRow[] }> {
  const [stringMovement, productMovement] = await Promise.all([listStringMovement(), listProductMovement()]);

  const strings: StockCoverRow[] = stringMovement
    .filter((r) => r.consumed90d > 0 && Number(r.currentStock) > 0)
    .map((r) => {
      const avgMonthly = r.consumed90d / 3;
      return { label: [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" "), currentStock: Number(r.currentStock), avgMonthlyConsumption: Math.round(avgMonthly * 100) / 100, estimatedMonthsCover: Math.round((Number(r.currentStock) / avgMonthly) * 10) / 10 };
    });

  const productsCover: StockCoverRow[] = productMovement
    .filter((r) => r.unitsSold90d > 0 && r.currentStock > 0)
    .map((r) => {
      const avgMonthly = r.unitsSold90d / 3;
      return { label: [r.brand, r.name, r.variant].filter(Boolean).join(" "), currentStock: r.currentStock, avgMonthlyConsumption: Math.round(avgMonthly * 100) / 100, estimatedMonthsCover: Math.round((r.currentStock / avgMonthly) * 10) / 10 };
    });

  return { strings, products: productsCover };
}

// -- slow-moving inventory (Phase 8 §31) ---------------------------------

export interface SlowMovingRow {
  kind: "string" | "product";
  id: string;
  label: string;
  stock: string;
  inventoryValueCents: number;
  lastMovementAt: Date | null;
  daysSinceMovement: number | null;
}

/** Stock with no sale/usage in `thresholdDays` (default 90) — presented as
 * facts (stock, value, last movement), never labeled "bad" (Phase 8 §31).
 * Only items with stock > 0 are considered "slow-moving" — depleted stock
 * isn't a slow-moving problem, it's just sold out. */
export async function listSlowMovingInventory(thresholdDays = 90): Promise<SlowMovingRow[]> {
  const [stringRows, productRows, stringValueRows, productValueRows] = await Promise.all([
    listStringMovement(),
    listProductMovement(),
    db
      .select({ id: stringProducts.id, value: sql<string>`coalesce(sum(${stringInventoryBatches.remainingQuantity} * ${stringInventoryBatches.costPerUnitCents}) filter (where ${stringInventoryBatches.remainingQuantity} > 0), 0)` })
      .from(stringProducts)
      .leftJoin(stringInventoryBatches, eq(stringInventoryBatches.stringProductId, stringProducts.id))
      .groupBy(stringProducts.id),
    db
      .select({ id: products.id, value: sql<string>`coalesce(sum(${productInventoryBatches.remainingQuantity} * ${productInventoryBatches.costPerUnitCents}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0)` })
      .from(products)
      .leftJoin(productInventoryBatches, eq(productInventoryBatches.productId, products.id))
      .groupBy(products.id),
  ]);

  // True integer cents, no /100 — see the unit note on InventoryValueOverview
  // above; this is fresh code computing its own sum, not reusing
  // getInventorySummary(), so it follows the schema's actual cents
  // convention and pairs with formatCents().
  const stringValueMap = new Map(stringValueRows.map((r) => [r.id, Math.round(Number(r.value))]));
  const productValueMap = new Map(productValueRows.map((r) => [r.id, Math.round(Number(r.value))]));

  const isSlow = (daysSince: number | null) => daysSince === null || daysSince >= thresholdDays;

  const strings: SlowMovingRow[] = stringRows
    .filter((r) => Number(r.currentStock) > 0 && isSlow(r.daysSinceMovement))
    .map((r) => ({ kind: "string" as const, id: r.stringProductId, label: [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" "), stock: r.currentStock, inventoryValueCents: stringValueMap.get(r.stringProductId) ?? 0, lastMovementAt: r.lastMovementAt, daysSinceMovement: r.daysSinceMovement }));

  const productsSlow: SlowMovingRow[] = productRows
    .filter((r) => r.currentStock > 0 && isSlow(r.daysSinceMovement))
    .map((r) => ({ kind: "product" as const, id: r.productId, label: [r.brand, r.name, r.variant].filter(Boolean).join(" "), stock: String(r.currentStock), inventoryValueCents: productValueMap.get(r.productId) ?? 0, lastMovementAt: r.lastMovementAt, daysSinceMovement: r.daysSinceMovement }));

  return [...strings, ...productsSlow].sort((a, b) => (b.daysSinceMovement ?? Infinity) - (a.daysSinceMovement ?? Infinity));
}

// -- purchase context (Phase 8 §32) --------------------------------------

export interface InventoryPurchaseContext {
  stringPurchasedCents: number;
  productPurchasedCents: number;
  totalPurchasedCents: number;
}

/** Inventory PURCHASED during the period (batch purchase_cost_cents for
 * batches received in range) — kept entirely separate from Operating
 * Expenses and from COGS (which the caller already has via
 * getFinancialSummary). A stock purchase is never itself an expense; it
 * becomes COGS only once sold, via the existing FIFO machinery. */
export async function getInventoryPurchaseContext(dateFrom: Date | null, dateTo: Date | null): Promise<InventoryPurchaseContext> {
  const stringConds = [];
  const productConds = [];
  if (dateFrom) {
    stringConds.push(gte(stringInventoryBatches.purchaseDate, dateFrom.toISOString().slice(0, 10)));
    productConds.push(gte(productInventoryBatches.purchaseDate, dateFrom.toISOString().slice(0, 10)));
  }
  if (dateTo) {
    stringConds.push(sql`${stringInventoryBatches.purchaseDate} < ${dateTo.toISOString().slice(0, 10)}`);
    productConds.push(sql`${productInventoryBatches.purchaseDate} < ${dateTo.toISOString().slice(0, 10)}`);
  }

  const [[stringRow], [productRow]] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${stringInventoryBatches.purchaseCostCents}), 0)` }).from(stringInventoryBatches).where(stringConds.length ? and(...stringConds) : sql`true`),
    db.select({ total: sql<string>`coalesce(sum(${productInventoryBatches.purchaseCostCents}), 0)` }).from(productInventoryBatches).where(productConds.length ? and(...productConds) : sql`true`),
  ]);

  const stringPurchasedCents = Number(stringRow?.total ?? 0);
  const productPurchasedCents = Number(productRow?.total ?? 0);
  return { stringPurchasedCents, productPurchasedCents, totalPurchasedCents: stringPurchasedCents + productPurchasedCents };
}

/** Inventory Analysis export (Phase 8 §41) — string and retail movement in
 * one file (a "Kind" column), current stock as of now (not date-filtered,
 * same as the report page itself). */
export async function exportInventoryAnalysisCsv(): Promise<string> {
  const [stringRows, productRows] = await Promise.all([listStringMovement(), listProductMovement()]);
  const rows: (string | number | null)[][] = [
    ...stringRows.map((r) => ["String", [r.brand, r.name, r.gauge, r.colour].filter(Boolean).join(" "), r.currentStock, r.trackingUnit, r.consumed30d, r.consumed90d, r.lastMovementAt ? new Date(r.lastMovementAt).toISOString() : "", r.daysSinceMovement]),
    ...productRows.map((r) => ["Product", `${r.code} ${[r.brand, r.name, r.variant].filter(Boolean).join(" ")}`, r.currentStock, "unit", r.unitsSold30d, r.unitsSold90d, r.lastMovementAt ? new Date(r.lastMovementAt).toISOString() : "", r.daysSinceMovement]),
  ];
  return toCsv(["Kind", "Item", "Current stock", "Unit", "Last 30 days", "Last 90 days", "Last movement", "Days since movement"], rows);
}
