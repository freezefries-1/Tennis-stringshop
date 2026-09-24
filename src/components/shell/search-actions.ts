"use server";

import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, products, racketBrands, racketModels, racketSeries, sales, stringJobs } from "@/db/schema";
import { racketLabel } from "@/lib/racket-label";

export interface CustomerSearchHit {
  id: string;
  name: string;
  code: string;
  phone: string;
}

/** Backs the site-wide ⌘K search's "Customers" group — real rows, same as
 * every other group in this file. */
export async function searchCustomers(query: string): Promise<CustomerSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const digits = q.replace(/\D/g, "");
  const like = `%${q}%`;

  const rows = await db
    .select({ id: customers.id, name: customers.name, code: customers.code, phone: customers.phone })
    .from(customers)
    .where(
      and(
        isNull(customers.archivedAt),
        digits
          ? sql`(${customers.name} ilike ${like} or ${customers.code} ilike ${like} or regexp_replace(${customers.phone}, '\\D', '', 'g') like ${"%" + digits + "%"})`
          : sql`(${customers.name} ilike ${like} or ${customers.code} ilike ${like})`,
      ),
    )
    .limit(4);

  return rows;
}

export interface RacketSearchHit {
  id: string;
  code: string;
  label: string;
  customerId: string;
  customerName: string;
}

/** "Rackets" group — real customer rackets (Phase 2/3), searched by racket
 * ID, nickname, or brand/series/model, whether that comes from a linked
 * catalogue model or the manual/fallback text columns. */
export async function searchRackets(query: string): Promise<RacketSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  const rows = await db
    .select({
      id: customerRackets.id,
      code: customerRackets.code,
      nickname: customerRackets.nickname,
      manualBrand: customerRackets.brand,
      manualSeries: customerRackets.series,
      manualModel: customerRackets.model,
      manualGenerationYear: customerRackets.generationYear,
      modelBrand: racketBrands.name,
      modelSeries: racketSeries.name,
      modelModel: racketModels.model,
      modelGenerationYear: racketModels.generationYear,
      modelGenerationName: racketModels.generationName,
      customerId: customers.id,
      customerName: customers.name,
    })
    .from(customerRackets)
    .innerJoin(customers, sql`${customers.id} = ${customerRackets.customerId}`)
    .leftJoin(racketModels, sql`${racketModels.id} = ${customerRackets.racketModelId}`)
    .leftJoin(racketSeries, sql`${racketSeries.id} = ${racketModels.seriesId}`)
    .leftJoin(racketBrands, sql`${racketBrands.id} = ${racketSeries.brandId}`)
    .where(
      and(
        isNull(customerRackets.archivedAt),
        sql`(
          ${customerRackets.code} ilike ${like}
          or ${customerRackets.nickname} ilike ${like}
          or ${customerRackets.brand} ilike ${like}
          or ${customerRackets.series} ilike ${like}
          or ${customerRackets.model} ilike ${like}
          or ${racketBrands.name} ilike ${like}
          or ${racketSeries.name} ilike ${like}
          or ${racketModels.model} ilike ${like}
        )`,
      ),
    )
    .limit(4);

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    customerId: r.customerId,
    customerName: r.customerName,
    label: racketLabel({
      brand: r.modelBrand ?? r.manualBrand,
      series: r.modelSeries ?? r.manualSeries,
      model: r.modelModel ?? r.manualModel,
      generationYear: r.modelGenerationYear ?? r.manualGenerationYear,
      generationName: r.modelGenerationName,
    }),
  }));
}

export interface JobSearchHit {
  id: string;
  code: string;
  customerName: string;
  racketLabel: string;
}

/** "String jobs" group — real jobs (Phase 4), searched by job ID, customer
 * name, racket (snapshotted at creation, so this matches regardless of
 * later racket edits), or the brand/name of either string on the job. */
export async function searchJobs(query: string): Promise<JobSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  const rows = await db
    .select({ id: stringJobs.id, code: stringJobs.code, customerName: stringJobs.customerName, racketLabel: stringJobs.racketLabel })
    .from(stringJobs)
    .where(
      sql`(
        ${stringJobs.code} ilike ${like}
        or ${stringJobs.customerName} ilike ${like}
        or ${stringJobs.racketLabel} ilike ${like}
        or exists (
          select 1 from string_job_strings sjs
          where sjs.string_job_id = ${stringJobs.id}
          and (sjs.brand_snapshot ilike ${like} or sjs.string_name_snapshot ilike ${like})
        )
      )`,
    )
    .orderBy(desc(stringJobs.receivedOn))
    .limit(5);

  return rows;
}

export interface ProductSearchHit {
  id: string;
  code: string;
  label: string;
}

/** "Products" group — real retail catalogue (Phase 6), searched by code,
 * name, brand, variant, SKU or barcode. Deliberately a lean standalone
 * query rather than reusing listProducts()/searchProductsForPicker() — the
 * search palette only needs id/code/label, not the stock-summary join those
 * helpers also compute. */
export async function searchProducts(query: string): Promise<ProductSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  const rows = await db
    .select({ id: products.id, code: products.code, name: products.name, brand: products.brand, variant: products.variant })
    .from(products)
    .where(
      and(
        isNull(products.archivedAt),
        sql`(
          ${products.code} ilike ${like}
          or ${products.name} ilike ${like}
          or ${products.brand} ilike ${like}
          or ${products.variant} ilike ${like}
          or ${products.sku} ilike ${like}
          or ${products.barcode} ilike ${like}
        )`,
      ),
    )
    .orderBy(products.name)
    .limit(4);

  return rows.map((r) => ({ id: r.id, code: r.code, label: [r.brand, r.name, r.variant].filter(Boolean).join(" ") }));
}

export interface SaleSearchHit {
  id: string;
  code: string;
  customerName: string | null;
}

/** "Sales" group — real POS sales (Phase 6), searched by sale code, customer
 * name, or any line item's description/SKU snapshot on that sale. Walk-in
 * sales (nullable customerId) match on code/item text only. */
export async function searchSales(query: string): Promise<SaleSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q}%`;

  const rows = await db
    .select({ id: sales.id, code: sales.code, customerName: customers.name })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .where(
      sql`(
        ${sales.code} ilike ${like}
        or ${customers.name} ilike ${like}
        or exists (
          select 1 from sale_items si
          where si.sale_id = ${sales.id}
          and (si.description_snapshot ilike ${like} or si.sku_snapshot ilike ${like})
        )
      )`,
    )
    .orderBy(desc(sales.occurredAt))
    .limit(4);

  return rows;
}
