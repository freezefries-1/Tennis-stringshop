"use server";

import { revalidatePath } from "next/cache";
import { createMachine, markMachineCleaned, setMachineArchived, updateMachine, type MachineUpdateInput } from "@/lib/machines";

export async function createMachineAction(name: string) {
  const machine = await createMachine(name);
  revalidatePath("/machines");
  return machine;
}

export async function updateMachineAction(id: string, input: MachineUpdateInput) {
  await updateMachine(id, input);
  revalidatePath("/machines");
}

export async function archiveMachineAction(id: string, archived: boolean) {
  await setMachineArchived(id, archived);
  revalidatePath("/machines");
}

export async function markMachineCleanedAction(id: string) {
  await markMachineCleaned(id);
  revalidatePath("/machines");
}
