import { and, asc, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customerRackets, customers } from "@/db/schema";

export { racketLabel } from "./racket-label";

export interface RacketInput {
  brand?: string | null;
  series?: string | null;
  model?: string | null;
  generationYear?: number | null;
  headSizeSqin?: string | null;
  stringPattern?: string | null;
  gripSize?: string | null;
  staticWeightG?: number | null;
  swingweight?: number | null;
  balanceMm?: number | null;
  customisationNotes?: string | null;
  notes?: string | null;
}

export type CustomerRacket = typeof customerRackets.$inferSelect;

export async function listRacketsForCustomer(customerId: string): Promise<CustomerRacket[]> {
  return db
    .select()
    .from(customerRackets)
    .where(and(sql`${customerRackets.customerId} = ${customerId}`, isNull(customerRackets.archivedAt)))
    .orderBy(asc(customerRackets.code));
}

export async function getRacket(id: string) {
  const [row] = await db
    .select({ racket: customerRackets, owner: customers })
    .from(customerRackets)
    .innerJoin(customers, sql`${customers.id} = ${customerRackets.customerId}`)
    .where(sql`${customerRackets.id} = ${id}`)
    .limit(1);
  return row ?? null;
}

function cleanInput(input: RacketInput) {
  return {
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
