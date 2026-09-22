import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers, racketBrands, racketModels, racketSeries } from "@/db/schema";
import { formatStringPattern } from "./racket-label";

export { racketLabel } from "./racket-label";

export interface RacketInput {
  // Set when linked to the master catalogue (Phase 3); null for manual/unknown entry.
  racketModelId?: string | null;
  nickname?: string | null;
  // Manual/fallback fields — only meaningful while racketModelId is null.
  brand?: string | null;
  series?: string | null;
  model?: string | null;
  generationYear?: number | null;
  headSizeSqin?: string | null;
  stringPattern?: string | null;
  // Actual/measured — always this physical racket's own data.
  gripSize?: string | null;
  staticWeightG?: number | null;
  swingweight?: number | null;
  balanceMm?: number | null;
  customisationNotes?: string | null;
  notes?: string | null;
}

export type CustomerRacket = typeof customerRackets.$inferSelect;
export type RacketModelRow = typeof racketModels.$inferSelect;

/** A customer racket plus its display-ready specs — resolved from the
 * linked master model when racket_model_id is set, or from the racket's own
 * manual/fallback columns otherwise. Callers (racketLabel, profile pages)
 * only ever need to read the `effective*` fields, never branch on whether
 * the racket is linked. `standard*` fields are null unless linked — they're
 * the manufacturer spec, kept separate from the racket's own measured data
 * (see schema.ts's comment on customer_rackets for why). */
export interface RacketWithSpecs extends CustomerRacket {
  effectiveBrand: string | null;
  effectiveSeries: string | null;
  effectiveModel: string | null;
  effectiveGenerationYear: number | null;
  effectiveGenerationName: string | null;
  effectiveHeadSizeSqin: string | null;
  effectiveStringPattern: string | null;
  standardWeightG: number | null;
  standardBalanceMm: number | null;
  standardLengthIn: string | null;
  tensionMinLbs: string | null;
  tensionMaxLbs: string | null;
  linkedModel: RacketModelRow | null;
}

function withEffectiveSpecs(racket: CustomerRacket, model: RacketModelRow | null, brandName: string | null, seriesName: string | null): RacketWithSpecs {
  if (model) {
    return {
      ...racket,
      effectiveBrand: brandName,
      effectiveSeries: seriesName,
      effectiveModel: model.model,
      effectiveGenerationYear: model.generationYear,
      effectiveGenerationName: model.generationName,
      effectiveHeadSizeSqin: model.headSizeSqin,
      effectiveStringPattern: formatStringPattern(model.stringPatternMains, model.stringPatternCrosses),
      standardWeightG: model.unstrungWeightG,
      standardBalanceMm: model.standardBalanceMm,
      standardLengthIn: model.standardLengthIn,
      tensionMinLbs: model.recommendedTensionMinLbs,
      tensionMaxLbs: model.recommendedTensionMaxLbs,
      linkedModel: model,
    };
  }
  return {
    ...racket,
    effectiveBrand: racket.brand,
    effectiveSeries: racket.series,
    effectiveModel: racket.model,
    effectiveGenerationYear: racket.generationYear,
    effectiveGenerationName: null,
    effectiveHeadSizeSqin: racket.headSizeSqin,
    effectiveStringPattern: racket.stringPattern,
    standardWeightG: null,
    standardBalanceMm: null,
    standardLengthIn: null,
    tensionMinLbs: null,
    tensionMaxLbs: null,
    linkedModel: null,
  };
}

const modelJoin = {
  model: racketModels,
  brandName: racketBrands.name,
  seriesName: racketSeries.name,
};

export async function listRacketsForCustomer(customerId: string, includeArchived = false): Promise<RacketWithSpecs[]> {
  const rows = await db
    .select({ racket: customerRackets, ...modelJoin })
    .from(customerRackets)
    .leftJoin(racketModels, eq(racketModels.id, customerRackets.racketModelId))
    .leftJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .leftJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(and(eq(customerRackets.customerId, customerId), includeArchived ? undefined : isNull(customerRackets.archivedAt)))
    .orderBy(asc(customerRackets.code));
  return rows.map((r) => withEffectiveSpecs(r.racket, r.model, r.brandName, r.seriesName));
}

export async function getRacket(id: string): Promise<{ racket: RacketWithSpecs; owner: typeof customers.$inferSelect } | null> {
  const [row] = await db
    .select({ racket: customerRackets, owner: customers, ...modelJoin })
    .from(customerRackets)
    .innerJoin(customers, eq(customers.id, customerRackets.customerId))
    .leftJoin(racketModels, eq(racketModels.id, customerRackets.racketModelId))
    .leftJoin(racketSeries, eq(racketSeries.id, racketModels.seriesId))
    .leftJoin(racketBrands, eq(racketBrands.id, racketSeries.brandId))
    .where(sql`${customerRackets.id} = ${id}`)
    .limit(1);
  if (!row) return null;
  return { racket: withEffectiveSpecs(row.racket, row.model, row.brandName, row.seriesName), owner: row.owner };
}

function cleanInput(input: RacketInput) {
  return {
    racketModelId: input.racketModelId ?? null,
    nickname: input.nickname?.trim() || null,
    brand: input.brand?.trim() || null,
    series: input.series?.trim() || null,
    model: input.model?.trim() || null,
    generationYear: input.generationYear ?? null,
    headSizeSqin: input.headSizeSqin?.trim() || null,
    stringPattern: input.stringPattern?.trim() || null,
    gripSize: input.gripSize?.trim() || null,
    staticWeightG: input.staticWeightG ?? null,
    swingweight: input.swingweight ?? null,
    balanceMm: input.balanceMm ?? null,
    customisationNotes: input.customisationNotes?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createRacket(customerId: string, input: RacketInput) {
  const [row] = await db
    .insert(customerRackets)
    .values({ customerId, ...cleanInput(input) })
    .returning();
  return row;
}

export async function updateRacket(id: string, input: RacketInput) {
  const [row] = await db
    .update(customerRackets)
    .set(cleanInput(input))
    .where(sql`${customerRackets.id} = ${id}`)
    .returning();
  return row ?? null;
}

/** Links a racket to a catalogue model without touching anything else on the
 * row — used to promote a manually-entered racket into the database (see
 * racket-actions.ts's promoteRacketToModelAction), where the old brand/
 * series/model text is left in place as a record of what was originally
 * typed rather than cleared (unlike updateRacket, which nulls those columns
 * when the edit form's mode is switched to "database"). */
export async function linkRacketToModel(id: string, racketModelId: string): Promise<CustomerRacket | null> {
  const [row] = await db.update(customerRackets).set({ racketModelId }).where(eq(customerRackets.id, id)).returning();
  return row ?? null;
}

/** Archiving (not deleting) a customer racket, same reasoning as brands/
 * series/racket_models: it drops off the customer's racket list and racket
 * selectors but the row — and anything that ends up referencing it, like
 * Phase 4's string job history — stays intact and can be unarchived. */
export async function setRacketArchived(id: string, archived: boolean): Promise<CustomerRacket | null> {
  const [row] = await db
    .update(customerRackets)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(customerRackets.id, id))
    .returning();
  return row ?? null;
}

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === FOREIGN_KEY_VIOLATION;
}

/** True, permanent deletion — unlike everything else in this file, which
 * archives. Only offered in the UI for correcting a mistaken entry, not as a
 * general-purpose remove. Nothing currently references a customer racket by
 * foreign key, but Phase 4's string_jobs table will (customer_racket_id,
 * not null) — if that ever exists for this racket, the delete is rejected by
 * Postgres rather than silently taking string job history down with it. */
export async function deleteRacket(id: string): Promise<"deleted" | "in_use"> {
  try {
    await db.delete(customerRackets).where(eq(customerRackets.id, id));
    return "deleted";
  } catch (err) {
    if (isForeignKeyViolation(err)) return "in_use";
    throw err;
  }
}
