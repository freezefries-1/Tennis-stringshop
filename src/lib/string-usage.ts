import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { stringPatternDefaults } from "@/db/schema";
import { getStringUsageDefaults } from "./settings";
import type { RacketWithSpecs } from "./rackets";

export type StringPatternDefault = typeof stringPatternDefaults.$inferSelect;

export interface PatternDefaultInput {
  pattern: string;
  fullBedLengthM?: string | null;
  mainLengthM?: string | null;
  crossLengthM?: string | null;
  notes?: string | null;
}

function cleanPatternInput(input: PatternDefaultInput) {
  return {
    pattern: input.pattern.trim(),
    fullBedLengthM: input.fullBedLengthM?.trim() || null,
    mainLengthM: input.mainLengthM?.trim() || null,
    crossLengthM: input.crossLengthM?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export async function listPatternDefaults(): Promise<StringPatternDefault[]> {
  return db.select().from(stringPatternDefaults).orderBy(asc(stringPatternDefaults.pattern));
}

export async function getPatternDefault(pattern: string): Promise<StringPatternDefault | null> {
  const [row] = await db
    .select()
    .from(stringPatternDefaults)
    .where(sql`lower(${stringPatternDefaults.pattern}) = lower(${pattern})`)
    .limit(1);
  return row ?? null;
}

export async function createPatternDefault(input: PatternDefaultInput): Promise<StringPatternDefault> {
  const [row] = await db.insert(stringPatternDefaults).values(cleanPatternInput(input)).returning();
  return row;
}

export async function updatePatternDefault(id: string, input: PatternDefaultInput): Promise<StringPatternDefault | null> {
  const [row] = await db
    .update(stringPatternDefaults)
    .set({ ...cleanPatternInput(input), updatedAt: new Date() })
    .where(eq(stringPatternDefaults.id, id))
    .returning();
  return row ?? null;
}

export async function deletePatternDefault(id: string): Promise<void> {
  await db.delete(stringPatternDefaults).where(eq(stringPatternDefaults.id, id));
}

export type UsageSource = "model" | "pattern" | "global";

export interface SuggestedStringUsage {
  fullBedM: number;
  mainM: number;
  crossM: number;
  fullBedSource: UsageSource;
  mainSource: UsageSource;
  crossSource: UsageSource;
  /** The pattern actually matched against string_pattern_defaults, for
   * display ("16x19 default") — null if the racket has no known pattern or
   * no default row exists for it. */
  matchedPattern: string | null;
}

function pick(modelValue: string | null | undefined, patternValue: string | null | undefined, globalValue: number): { value: number; source: UsageSource } {
  if (modelValue != null && modelValue !== "") return { value: Number(modelValue), source: "model" };
  if (patternValue != null && patternValue !== "") return { value: Number(patternValue), source: "pattern" };
  return { value: globalValue, source: "global" };
}

/** The suggestion priority from the brief: a racket model's own recommended
 * length, then its string pattern's configured default, then the global
 * default — resolved independently per field (full bed / main / cross) so a
 * model that only sets one of the three still gets sensible values for the
 * others, rather than an all-or-nothing switch. Never touches inventory —
 * this only decides what to pre-fill; the actual saved quantityUsed is what
 * drives deduction/COGS (see src/lib/jobs.ts). */
export async function getSuggestedStringUsage(racket: RacketWithSpecs): Promise<SuggestedStringUsage> {
  const model = racket.linkedModel;
  const pattern = racket.effectiveStringPattern;
  const [patternDefault, globalDefault] = await Promise.all([pattern ? getPatternDefault(pattern) : Promise.resolve(null), getStringUsageDefaults()]);

  const fullBed = pick(model?.recommendedFullBedLengthM, patternDefault?.fullBedLengthM, globalDefault.fullBedUsageM);
  const main = pick(model?.recommendedMainLengthM, patternDefault?.mainLengthM, globalDefault.mainUsageM);
  const cross = pick(model?.recommendedCrossLengthM, patternDefault?.crossLengthM, globalDefault.crossUsageM);

  return {
    fullBedM: fullBed.value,
    mainM: main.value,
    crossM: cross.value,
    fullBedSource: fullBed.source,
    mainSource: main.source,
    crossSource: cross.source,
    matchedPattern: patternDefault ? patternDefault.pattern : null,
  };
}
