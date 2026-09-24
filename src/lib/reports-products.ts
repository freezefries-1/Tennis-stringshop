// Phase 8 — Reports → Products. Every figure is derived from sale_items
// grouped by product_id — a return posts as its own reversing sale_items
// row with negative quantity/lineTotalCents/cogsAmountCents (see
// returnSaleItem in sales.ts), so a straight SUM across all matching rows
// is already net of returns without any special-case subtraction (Phase 8
// §22/§50: sell 10, return 2 → units sold 8, automatically).

import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { products, productCategories, productInventoryBatches, sales, saleItems } from "@/db/schema";
import type { FinancialsFilters } from "./financials";
import { toCsv } from "./csv";

function saleConditions(filters: FinancialsFilters) {
  const conditions = [sql`${sales.status} != 'cancelled'`, eq(saleItems.itemType, "product")];
  if (filters.dateFrom) conditions.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(sales.occurredAt, filters.dateTo));
  return conditions;
}

export interface ProductAnalyticsRow {
  productId: string;
  code: string;
  name: string;
  brand: string | null;
  variant: string | null;
  categoryName: string;
  unitsSold: number;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  grossMarginPct: number | null;
  currentStock: number;
  inventoryValueCents: number;
}

/** Every tracked product, with current stock/inventory value (point-in-time
 * NOW, from remaining batch cost basis — Phase 8 §28) alongside period-
 * scoped sales figures. Products with zero activity in the period still
 * appear (with zero sales figures) as long as they have stock or exist at
 * all — this is the full catalogue view; listTopProducts below is the
 * limited/sorted version for dashboard-style Top-N cards. */
export async function getProductAnalytics(filters: FinancialsFilters): Promise<ProductAnalyticsRow[]> {
  const [salesRows, stockRows] = await Promise.all([
    db
      .select({ productId: saleItems.productId, units: sql<string>`coalesce(sum(${saleItems.quantity}), 0)`, revenue: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)`, cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)` })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(and(...saleConditions(filters)))
      .groupBy(saleItems.productId),
    db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        brand: products.brand,
        variant: products.variant,
        categoryName: productCategories.name,
        currentStock: sql<string>`coalesce(sum(${productInventoryBatches.remainingQuantity}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0)`,
        inventoryValue: sql<string>`coalesce(sum(${productInventoryBatches.remainingQuantity} * ${productInventoryBatches.costPerUnitCents}) filter (where ${productInventoryBatches.remainingQuantity} > 0), 0)`,
      })
      .from(products)
      .innerJoin(productCategories, eq(productCategories.id, products.categoryId))
      .leftJoin(productInventoryBatches, eq(productInventoryBatches.productId, products.id))
      .where(isNull(products.archivedAt))
      .groupBy(products.id, products.code, products.name, products.brand, products.variant, productCategories.name),
  ]);

  const salesMap = new Map(salesRows.filter((r) => r.productId != null).map((r) => [r.productId as string, r]));

  return stockRows
    .map((s) => {
      const sale = salesMap.get(s.id);
      const revenueCents = Number(sale?.revenue ?? 0);
      const cogsCents = Number(sale?.cogs ?? 0);
      const grossProfitCents = revenueCents - cogsCents;
      return {
        productId: s.id,
        code: s.code,
        name: s.name,
        brand: s.brand,
        variant: s.variant,
        categoryName: s.categoryName,
        unitsSold: Number(sale?.units ?? 0),
        revenueCents,
        cogsCents,
        grossProfitCents,
        grossMarginPct: revenueCents !== 0 ? (grossProfitCents / revenueCents) * 100 : null,
        currentStock: Number(s.currentStock),
        // True integer cents — remainingQuantity × costPerUnitCents (the
        // batch's cost is already denominated in cents, see
        // receiveProductStock) IS the total in cents already, no /100
        // needed. Caught via TEST-52 (FIFO value) during this phase: the
        // pre-existing getInventorySummary() in products.ts/
        // string-inventory.ts divides by 100 here too, but that's actually
        // correct there ONLY because its one caller (/inventory's
        // formatMoney0) doesn't divide again — a confusing but harmless
        // mislabeling left as-is rather than touched. This is fresh code,
        // so it follows the schema's actual "integer cents everywhere"
        // convention and pairs with formatCents(), not formatMoney0().
        inventoryValueCents: Math.round(Number(s.inventoryValue)),
      };
    })
    .filter((r) => r.unitsSold !== 0 || r.currentStock > 0);
}

export interface TopProductRow {
  productId: string;
  label: string;
  value: number;
}

/** Three SEPARATE limited (LIMIT-N, sorted in SQL) rankings, not one
 * composite "best product" score (Phase 8 §23) — each is its own query so
 * the database does the sorting and limiting, never a full-catalogue fetch
 * sorted in JS. */
export async function listTopProductsByUnits(filters: FinancialsFilters, limit = 10): Promise<TopProductRow[]> {
  const rows = await db
    .select({ productId: saleItems.productId, name: products.name, brand: products.brand, variant: products.variant, value: sql<string>`sum(${saleItems.quantity})` })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(and(...saleConditions(filters)))
    .groupBy(saleItems.productId, products.name, products.brand, products.variant)
    .having(sql`sum(${saleItems.quantity}) > 0`)
    .orderBy(desc(sql`sum(${saleItems.quantity})`))
    .limit(limit);
  return rows.map((r) => ({ productId: r.productId as string, label: [r.brand, r.name, r.variant].filter(Boolean).join(" "), value: Number(r.value) }));
}

export async function listTopProductsByRevenue(filters: FinancialsFilters, limit = 10): Promise<TopProductRow[]> {
  const rows = await db
    .select({ productId: saleItems.productId, name: products.name, brand: products.brand, variant: products.variant, value: sql<string>`sum(${saleItems.lineTotalCents})` })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(and(...saleConditions(filters)))
    .groupBy(saleItems.productId, products.name, products.brand, products.variant)
    .having(sql`sum(${saleItems.lineTotalCents}) > 0`)
    .orderBy(desc(sql`sum(${saleItems.lineTotalCents})`))
    .limit(limit);
  return rows.map((r) => ({ productId: r.productId as string, label: [r.brand, r.name, r.variant].filter(Boolean).join(" "), value: Math.round(Number(r.value)) }));
}

export async function listTopProductsByGrossProfit(filters: FinancialsFilters, limit = 10): Promise<TopProductRow[]> {
  const rows = await db
    .select({
      productId: saleItems.productId,
      name: products.name,
      brand: products.brand,
      variant: products.variant,
      value: sql<string>`sum(${saleItems.lineTotalCents}) - sum(${saleItems.cogsAmountCents})`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .where(and(...saleConditions(filters)))
    .groupBy(saleItems.productId, products.name, products.brand, products.variant)
    .having(sql`sum(${saleItems.lineTotalCents}) - sum(${saleItems.cogsAmountCents}) > 0`)
    .orderBy(desc(sql`sum(${saleItems.lineTotalCents}) - sum(${saleItems.cogsAmountCents})`))
    .limit(limit);
  return rows.map((r) => ({ productId: r.productId as string, label: [r.brand, r.name, r.variant].filter(Boolean).join(" "), value: Math.round(Number(r.value)) }));
}

// -- category analysis --------------------------------------------------

export interface ProductCategoryRow {
  categoryId: string;
  categoryName: string;
  unitsSold: number;
  revenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  grossMarginPct: number | null;
}

export async function listProductCategoryAnalysis(filters: FinancialsFilters): Promise<ProductCategoryRow[]> {
  const rows = await db
    .select({
      categoryId: productCategories.id,
      categoryName: productCategories.name,
      units: sql<string>`coalesce(sum(${saleItems.quantity}), 0)`,
      revenue: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)`,
      cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)`,
    })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .innerJoin(products, eq(products.id, saleItems.productId))
    .innerJoin(productCategories, eq(productCategories.id, products.categoryId))
    .where(and(...saleConditions(filters)))
    .groupBy(productCategories.id, productCategories.name)
    .orderBy(desc(sql`sum(${saleItems.lineTotalCents})`));

  return rows.map((r) => {
    const revenueCents = Number(r.revenue);
    const cogsCents = Number(r.cogs);
    const grossProfitCents = revenueCents - cogsCents;
    return { categoryId: r.categoryId, categoryName: r.categoryName, unitsSold: Number(r.units), revenueCents, cogsCents, grossProfitCents, grossMarginPct: revenueCents !== 0 ? (grossProfitCents / revenueCents) * 100 : null };
  });
}

/** Product Performance export (Phase 8 §41). */
export async function exportProductAnalyticsCsv(filters: FinancialsFilters): Promise<string> {
  const rows = await getProductAnalytics(filters);
  return toCsv(
    ["Code", "Brand", "Name", "Variant", "Category", "Units sold", "Revenue (cents)", "COGS (cents)", "Gross profit (cents)", "Gross margin %", "Current stock", "Inventory value (cents)"],
    rows.map((r) => [r.code, r.brand, r.name, r.variant, r.categoryName, r.unitsSold, r.revenueCents, r.cogsCents, r.grossProfitCents, r.grossMarginPct === null ? "" : r.grossMarginPct.toFixed(1), r.currentStock, r.inventoryValueCents]),
  );
}
