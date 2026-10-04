"use server";

import { revalidatePath } from "next/cache";
import { createSupplier, deleteSupplier, renameSupplier, setSupplierActive } from "@/lib/string-inventory";

// Suppliers are shared between string inventory and retail products (both
// string_inventory_batches and product_inventory_batches, plus a product's
// own default supplier, reference the same suppliers table) — every write
// here revalidates both domains' pages, not just this management page.
function revalidateSupplierPages() {
  revalidatePath("/suppliers");
  revalidatePath("/inventory/receive");
  revalidatePath("/products/receive");
}

export async function createSupplierAction(name: string) {
  const created = await createSupplier(name);
  revalidateSupplierPages();
  return created;
}

export async function renameSupplierAction(id: string, name: string) {
  await renameSupplier(id, name);
  revalidateSupplierPages();
}

export async function setSupplierActiveAction(id: string, active: boolean) {
  await setSupplierActive(id, active);
  revalidateSupplierPages();
}

export async function deleteSupplierAction(id: string) {
  const result = await deleteSupplier(id);
  revalidateSupplierPages();
  return result;
}
