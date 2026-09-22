import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, racketBrands, racketModels, racketSeries } from "@/db/schema";

export type RacketBrand = typeof racketBrands.$inferSelect;
export type RacketSeries = typeof racketSeries.$inferSelect;
export type RacketModel = typeof racketModels.$inferSelect;

/** Shape racketLabel() (src/lib/racket-label.ts) expects, from a bare
 * RacketModel row (no brand/series names — pass those in separately when
 * available, e.g. via RacketModelWithNames). */
export function racketLabelParts(m: Pick<RacketModel, "model" | "generationYear" | "generationName">) {
  return { model: m.model, generationYear: m.generationYear, generationName: m.generationName };
}

export interface RacketModelWithNames extends RacketModel {
  brandName: string;
  seriesName: string;
}

// -- brands -------------------------------------------------------------

export async function listBrands(includeArchived = false): Promise<RacketBrand[]> {
  return db
    .select()
    .from(racketBrands)
    .where(includeArchived ? undefined : isNull(racketBrands.archivedAt))
    .orderBy(asc(racketBrands.name));
}

export async function findBrandByName(name: string): Promise<RacketBrand | null> {
  const [row] = await db
    .select()
    .from(racketBrands)
    .where(and(isNull(racketBrands.archivedAt), sql`lower(${racketBrands.name}) = lower(${name})`))
    .limit(1);
  return row ?? null;
}

export async function createBrand(name: string): Promise<RacketBrand> {
  const [row] = await db.insert(racketBrands).values({ name: name.trim() }).returning();
  return row;
}

export async function renameBrand(id: string, name: string): Promise<RacketBrand | null> {
  const [row] = await db.update(racketBrands).set({ name: name.trim() }).where(eq(racketBrands.id, id)).returning();
  return row ?? null;
}

export async function setBrandArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(racketBrands)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(racketBrands.id, id));
}

// -- series ---------------------------------------------------------------

export async function listSeriesForBrand(brandId: string, includeArchived = false): Promise<RacketSeries[]> {
  return db
    .select()
    .from(racketSeries)
    .where(and(eq(racketSeries.brandId, brandId), includeArchived ? undefined : isNull(racketSeries.archivedAt)))
    .orderBy(asc(racketSeries.name));
}

export async function findSeriesByName(brandId: string, name: string): Promise<RacketSeries | null> {
  const [row] = await db
    .select()
    .from(racketSeries)
    .where(and(eq(racketSeries.brandId, brandId), isNull(racketSeries.archivedAt), sql`lower(${racketSeries.name}) = lower(${name})`))
    .limit(1);
  return row ?? null;
}

export async function createSeries(brandId: string, name: string): Promise<RacketSeries> {
  const [row] = await db.insert(racketSeries).values({ brandId, name: name.trim() }).returning();
  return row;
}

export async function renameSeries(id: string, name: string): Promise<RacketSeries | null> {
  const [row] = await db.update(racketSeries).set({ name: name.trim() }).where(eq(racketSeries.id, id)).returning();
  return row ?? null;
}

export async function setSeriesArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(racketSeries)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(racketSeries.id, id));
}

// -- models -----------------------------------------------------------------

export interface RacketModelInput {
  seriesId: string;
  model: string;
  generationYear?: number | null;
  generationName?: string | null;
  headSizeSqin?: string | null;
  stringPatternMains?: number | null;
  stringPatternCrosses?: number | null;
  unstrungWeightG?: number | null;
  standardBalanceMm?: number | null;
  standardLengthIn?: string | null;
  recommendedTensionMinLbs?: string | null;
  recommendedTensionMaxLbs?: string | null;
  notes?: string | null;
}

function cleanModelInput(input: RacketModelInput) {
  return {
    seriesId: input.seriesId,
    model: input.model.trim(),
    generationYear: input.generationYear ?? null,
    generationName: input.generationName?.trim() || null,
    headSizeSqin: input.headSizeSqin?.trim() || null,
    stringPatternMains: input.stringPatternMains ?? null,
    stringPatternCrosses: input.stringPatternCrosses ?? null,
    unstrungWeightG: input.unstrungWeightG ?? null,
    standardBalanceMm: input.standardBalanceMm ?? null,
    standardLengthIn: input.standardLengthIn?.trim() || null,
    recommendedTensionMinLbs: input.recommendedTensionMinLbs?.trim() || null,
    recommendedTensionMaxLbs: input.recommendedTensionMaxLbs?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

/** Models within a series (a row per model+generation) — the third level of
 * the Brand → Series → Model(+Generation) picker. */
export async function listModelsForSeries(seriesId: string, includeArchived = false): Promise<RacketModel[]> {
  return db
    .select()
    .from(racketModels)
    .where(and(eq(racketModels.seriesId, seriesId), includeArchived ? undefined : isNull(racketModels.archivedAt)))
    .orderBy(asc(racketModels.model), desc(racketModels.generationYear));
}

/** Same brand + series + model name + generation year already exists —
 * checked before creating a new master model (soft warn, not a hard block:
 * near-identical names can legitimately be different models). */
export async function findDuplicateModel(
  seriesId: string,
  model: string,
  generationYear: number | null,
  excludeId?: string,
): Promise<RacketModel | null> {
  const [row] = await db
    .select()
    .from(racketModels)
    .where(
      and(
        eq(racketModels.seriesId, seriesId),
        isNull(racketModels.archivedAt),
        sql`lower(${racketModels.model}) = lower(${model})`,
        generationYear == null ? sql`${racketModels.generationYear} is null` : eq(racketModels.generationYear, generationYear),
        excludeId ? sql`${racketModels.id} != ${excludeId}` : sql`true`,
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createModel(input: RacketModelInput): Promise<RacketModel> {
  const [row] = await db.insert(racketModels).values(cleanModelInput(input)).returning();
  return row;
}

export async function updateModel(id: string, input: RacketModelInput): Promise<RacketModel | null> {
  const [row] = await db.update(racketModels).set(cleanModelInput(input)).where(eq(racketModels.id, id)).returning();
  return row ?? null;
}

export async function setModelArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(racketModels)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(racketModels.id, id));
}

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === FOREIGN_KEY_VIOLATION;
}

/** True, permanent deletion — unlike setModelArchived. Only offered in the
 * UI for correcting a mistaken entry (a typo'd duplicate, say), not a
 * general-purpose remove — archiving is still the default for a real model
 * nobody wants selectable anymore. Postgres rejects this if any customer
 * racket (active or archived) still references the model via racket_model_id,
 * which the archived-usage check below also reports up front so the caller
 * can show a clear message instead of a raw DB error. */
export async function deleteModel(id: string): Promise<"deleted" | "in_use"> {
  try {
    await db.delete(racketModels).where(eq(racketModels.id, id));
    return "deleted";
  } catch (err) {
    if (isForeignKeyViolation(err)) return "in_use";
    throw err;
  }
}

/** Unlike countCustomerRacketsForModel (which only counts active rackets,
 * for the model detail page's "in use" figure), this includes archived
 * rackets too — any of them still holds a racket_model_id foreign key that
 * would block deleteModel, so the delete confirmation needs the true total. */
export async function countAllCustomerRacketsForModel(modelId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customerRackets)
    .where(eq(customerRackets.racketModelId, modelId));
  return row?.count ?? 0;
}

export async function getModelWithNames(id: string): Promise<RacketModelWithNames | null> {
  const [row] = await db
    .select({
      model: racketModels,
      brandName: racketBrands.name,
      seriesName: racketSeries.name,
    })
    .from(racketModels)
    .innerJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .innerJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(eq(racketModels.id, id))
    .limit(1);
  if (!row) return null;
  return { ...row.model, brandName: row.brandName, seriesName: row.seriesName };
}

export async function countCustomerRacketsForModel(modelId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(customerRackets)
    .where(and(eq(customerRackets.racketModelId, modelId), isNull(customerRackets.archivedAt)));
  return row?.count ?? 0;
}

export interface CustomerRacketUsingModel {
  racketId: string;
  code: string;
  nickname: string | null;
  customerId: string;
  customerName: string;
}

export async function listCustomerRacketsForModel(modelId: string): Promise<CustomerRacketUsingModel[]> {
  const rows = await db
    .select({
      racketId: customerRackets.id,
      code: customerRackets.code,
      nickname: customerRackets.nickname,
      customerId: customers.id,
      customerName: customers.name,
    })
    .from(customerRackets)
    .innerJoin(customers, eq(customers.id, customerRackets.customerId))
    .where(and(eq(customerRackets.racketModelId, modelId), isNull(customerRackets.archivedAt)))
    .orderBy(asc(customerRackets.code));
  return rows;
}

export interface ModelSearchFilters {
  query?: string;
  brandId?: string;
  includeArchived?: boolean;
}

/** Browse/search the catalogue — the main Racket Database page. */
export async function searchModels(filters: ModelSearchFilters): Promise<RacketModelWithNames[]> {
  const q = filters.query?.trim();
  const like = q ? `%${q}%` : null;

  const rows = await db
    .select({
      model: racketModels,
      brandName: racketBrands.name,
      seriesName: racketSeries.name,
    })
    .from(racketModels)
    .innerJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .innerJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(
      and(
        filters.includeArchived ? sql`true` : isNull(racketModels.archivedAt),
        filters.brandId ? eq(racketBrands.id, filters.brandId) : sql`true`,
        like
          ? sql`(${racketBrands.name} ilike ${like} or ${racketSeries.name} ilike ${like} or ${racketModels.model} ilike ${like} or ${racketModels.generationName} ilike ${like} or ${racketModels.generationYear}::text ilike ${like})`
          : sql`true`,
      ),
    )
    .orderBy(asc(racketBrands.name), asc(racketSeries.name), asc(racketModels.model), desc(racketModels.generationYear));

  return rows.map((r) => ({ ...r.model, brandName: r.brandName, seriesName: r.seriesName }));
}
