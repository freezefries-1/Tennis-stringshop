// Phase 8 — Reports → Data Quality. Lightweight, factual warnings only
// (Phase 8 §40/§55) — never hidden from the user, never shown on the main
// Dashboard (§40: "do not clutter the main Dashboard with technical
// warnings"). Unknown-COGS is never silently treated as $0 revenue-wise
// (that already holds throughout this app — cogsAmountCents really is 0 for
// an unpriced custom line, and this report is what surfaces that instead of
// letting it quietly inflate Gross Profit).

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sales, saleItems, stringJobs, stringProducts, stringInventoryBatches, productInventoryBatches } from "@/db/schema";

export interface DataQualityReport {
  unknownCogsSaleCount: number;
  unknownCogsRevenueCents: number;
  stringProductsMissingCost: { id: string; label: string }[];
  jobsMissingLinkedSale: { id: string; code: string; completedAt: Date | null }[];
  negativeStringBatches: { id: string; batchNumber: string; remainingQuantity: string }[];
  negativeProductBatches: { id: string; batchNumber: string; remainingQuantity: number }[];
}

export async function getDataQualityReport(): Promise<DataQualityReport> {
  const [[unknownCogsRow], missingCostRows, missingSaleRows, negStringRows, negProductRows] = await Promise.all([
    // Same criteria as getUnknownCogsRevenueCents in financials.ts — a
    // 'custom' line with $0 recorded cost, on a non-cancelled sale.
    db
      .select({ count: sql<number>`count(distinct ${saleItems.saleId})::int`, revenue: sql<string>`coalesce(sum(${saleItems.lineTotalCents}), 0)` })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(and(sql`${sales.status} != 'cancelled'`, eq(saleItems.itemType, "custom"), eq(saleItems.cogsAmountCents, 0))),
    // A string product never received (no batch, ever) has no cost basis to
    // draw from if sold — surfaced so it can be given an opening batch/cost
    // before it's next sold, not caught after the fact.
    db
      .select({ id: stringProducts.id, brand: stringProducts.brand, name: stringProducts.name, gauge: stringProducts.gauge, colour: stringProducts.colour })
      .from(stringProducts)
      .leftJoin(stringInventoryBatches, eq(stringInventoryBatches.stringProductId, stringProducts.id))
      .where(and(isNull(stringProducts.archivedAt), sql`${stringInventoryBatches.id} is null`)),
    // Completed/collected jobs with no linked Sale — expected for jobs
    // completed before Phase 6 shipped (see customers.ts's own comment on
    // this same exception), flagged here for visibility either way rather
    // than silently assumed.
    db
      .select({ id: stringJobs.id, code: stringJobs.code, completedAt: stringJobs.completedAt })
      .from(stringJobs)
      .where(and(sql`${stringJobs.status} in ('completed','collected')`, sql`${stringJobs.saleId} is null`)),
    db.select({ id: stringInventoryBatches.id, batchNumber: stringInventoryBatches.batchNumber, remainingQuantity: stringInventoryBatches.remainingQuantity }).from(stringInventoryBatches).where(sql`${stringInventoryBatches.remainingQuantity} < 0`),
    db.select({ id: productInventoryBatches.id, batchNumber: productInventoryBatches.batchNumber, remainingQuantity: productInventoryBatches.remainingQuantity }).from(productInventoryBatches).where(sql`${productInventoryBatches.remainingQuantity} < 0`),
  ]);

  return {
    unknownCogsSaleCount: unknownCogsRow?.count ?? 0,
    unknownCogsRevenueCents: Number(unknownCogsRow?.revenue ?? 0),
    stringProductsMissingCost: missingCostRows.map((r) => ({ id: r.id, label: [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" ") })),
    jobsMissingLinkedSale: missingSaleRows,
    negativeStringBatches: negStringRows,
    negativeProductBatches: negProductRows,
  };
}
