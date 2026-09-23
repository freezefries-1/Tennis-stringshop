"use server";

import { revalidatePath } from "next/cache";
import { setStringUsageDefaults, setInventoryDefaults, type StringUsageDefaults, type InventoryDefaults } from "@/lib/settings";
import { createPatternDefault, deletePatternDefault, getPatternDefault, updatePatternDefault, type PatternDefaultInput, type StringPatternDefault } from "@/lib/string-usage";

export async function saveStringUsageDefaultsAction(values: StringUsageDefaults) {
  await setStringUsageDefaults(values);
  revalidatePath("/settings");
}

export async function saveInventoryDefaultsAction(values: InventoryDefaults) {
  await setInventoryDefaults(values);
  revalidatePath("/settings");
  revalidatePath("/inventory");
}

export interface SavePatternDefaultResult {
  status: "saved" | "duplicate";
  row?: StringPatternDefault;
}

/** `pattern` is unique at the DB level — this pre-checks (case-insensitive,
 * same as getPatternDefault's lookup) so a duplicate resolves to a friendly
 * result instead of an unhandled constraint-violation crash. */
export async function createPatternDefaultAction(input: PatternDefaultInput): Promise<SavePatternDefaultResult> {
  const existing = await getPatternDefault(input.pattern);
  if (existing) return { status: "duplicate" };
  const row = await createPatternDefault(input);
  revalidatePath("/settings");
  return { status: "saved", row };
}

export async function updatePatternDefaultAction(id: string, input: PatternDefaultInput) {
  await updatePatternDefault(id, input);
  revalidatePath("/settings");
}

export async function deletePatternDefaultAction(id: string) {
  await deletePatternDefault(id);
  revalidatePath("/settings");
}
