"use server";

import { revalidatePath } from "next/cache";
import { setStringUsageDefaults, setInventoryDefaults, type StringUsageDefaults, type InventoryDefaults } from "@/lib/settings";

export async function saveStringUsageDefaultsAction(values: StringUsageDefaults) {
  await setStringUsageDefaults(values);
  revalidatePath("/settings");
}

export async function saveInventoryDefaultsAction(values: InventoryDefaults) {
  await setInventoryDefaults(values);
  revalidatePath("/settings");
  revalidatePath("/inventory");
}
