import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

// One JSON document per settings key (see schema.ts's comment on the table).
// Phase 5 only needs two keys — string usage defaults (brief §12, speeds up
// job entry) and inventory low-stock defaults (brief §31) — everything else
// PAGES.settings still lists (business name, payment methods, ...) stays
// out of scope until its own phase.

export interface StringUsageDefaults {
  fullBedUsageM: number;
  mainUsageM: number;
  crossUsageM: number;
}

export const DEFAULT_STRING_USAGE: StringUsageDefaults = {
  fullBedUsageM: 11,
  mainUsageM: 6,
  crossUsageM: 5.5,
};

export interface InventoryDefaults {
  lowStockThresholdM: number;
  lowStockThresholdSets: number;
  // Phase 6 — same role as the two above, for general retail products
  // (src/lib/products.ts) rather than string reels/sets.
  lowStockThresholdUnits: number;
}

export const DEFAULT_INVENTORY_SETTINGS: InventoryDefaults = {
  lowStockThresholdM: 20,
  lowStockThresholdSets: 2,
  lowStockThresholdUnits: 5,
};

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (!row) return fallback;
  return { ...fallback, ...(row.value as Partial<T>) };
}

async function setSetting<T>(key: string, value: T): Promise<void> {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getStringUsageDefaults(): Promise<StringUsageDefaults> {
  return getSetting("string_defaults", DEFAULT_STRING_USAGE);
}

export async function setStringUsageDefaults(value: StringUsageDefaults): Promise<void> {
  await setSetting("string_defaults", value);
}

export async function getInventoryDefaults(): Promise<InventoryDefaults> {
  return getSetting("inventory_defaults", DEFAULT_INVENTORY_SETTINGS);
}

export async function setInventoryDefaults(value: InventoryDefaults): Promise<void> {
  await setSetting("inventory_defaults", value);
}
