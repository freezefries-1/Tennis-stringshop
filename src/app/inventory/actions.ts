"use server";

import { revalidatePath } from "next/cache";
import {
  createStringProduct,
  updateStringProduct,
  setStringProductArchived,
  deleteStringProduct,
  findDuplicateStringProduct,
  listStringProducts,
  listSuppliers,
  createSupplier,
  receiveStock,
  recordManualAdjustment,
  updateBatchCost,
  InsufficientStockError,
  exportStringProductsCsv,
  exportBatchesCsv,
  exportMovementsCsv,
  type StringProductInput,
  type ReceiveStockInput,
  type ManualAdjustmentInput,
  type UpdateBatchCostInput,
} from "@/lib/string-inventory";

export async function searchStringProductsAction(query: string) {
  return listStringProducts({ query, includeArchived: false });
}

export async function fetchAllActiveProducts() {
  return listStringProducts({ includeArchived: false });
}

export async function fetchSuppliers() {
  return listSuppliers();
}

export async function quickCreateSupplierAction(name: string) {
  return createSupplier(name);
}

export interface SaveProductResult {
  status: "saved" | "duplicate";
  duplicateLabel?: string;
  productId?: string;
}

/** allowDuplicate lets the caller confirm past the soft duplicate warning
 * (brief §4 — "avoid accidental duplicates" but "don't be overly
 * aggressive"), same two-step pattern as the racket catalogue's model form. */
export async function createStringProductAction(input: StringProductInput, allowDuplicate = false): Promise<SaveProductResult> {
  if (!allowDuplicate) {
    const dup = await findDuplicateStringProduct(input.brand, input.name, input.gauge ?? null, input.colour ?? null);
    if (dup) return { status: "duplicate", duplicateLabel: `${dup.brand} ${dup.name}${dup.gauge ? ` ${dup.gauge}mm` : ""}${dup.colour ? ` ${dup.colour}` : ""}` };
  }
  const product = await createStringProduct(input);
  revalidatePath("/inventory");
  return { status: "saved", productId: product.id };
}

export async function updateStringProductAction(id: string, input: StringProductInput, allowDuplicate = false): Promise<SaveProductResult> {
  if (!allowDuplicate) {
    const dup = await findDuplicateStringProduct(input.brand, input.name, input.gauge ?? null, input.colour ?? null, id);
    if (dup) return { status: "duplicate", duplicateLabel: `${dup.brand} ${dup.name}${dup.gauge ? ` ${dup.gauge}mm` : ""}${dup.colour ? ` ${dup.colour}` : ""}` };
  }
  await updateStringProduct(id, input);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/products/${id}`);
  return { status: "saved", productId: id };
}

export async function setStringProductArchivedAction(id: string, archived: boolean) {
  await setStringProductArchived(id, archived);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/products/${id}`);
}

export interface DeleteProductResult {
  status: "deleted" | "in_use";
}

export async function deleteStringProductAction(id: string): Promise<DeleteProductResult> {
  const result = await deleteStringProduct(id);
  if (result === "in_use") return { status: "in_use" };
  revalidatePath("/inventory");
  return { status: "deleted" };
}

export async function receiveStockAction(input: ReceiveStockInput) {
  const result = await receiveStock(input);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/products/${input.stringProductId}`);
  return result;
}

export interface ManualAdjustmentResult {
  status: "ok" | "insufficient_stock";
  available?: number;
  needed?: number;
}

export async function recordManualAdjustmentAction(input: ManualAdjustmentInput, productId: string): Promise<ManualAdjustmentResult> {
  try {
    await recordManualAdjustment(input);
  } catch (err) {
    if (err instanceof InsufficientStockError) return { status: "insufficient_stock", available: err.available, needed: err.needed };
    throw err;
  }
  revalidatePath("/inventory");
  revalidatePath(`/inventory/products/${productId}`);
  return { status: "ok" };
}

export async function updateBatchCostAction(input: UpdateBatchCostInput, productId: string) {
  await updateBatchCost(input);
  revalidatePath("/inventory");
  revalidatePath(`/inventory/products/${productId}`);
  return { status: "ok" as const };
}

export async function exportProductsCsvAction() {
  return exportStringProductsCsv();
}
export async function exportBatchesCsvAction() {
  return exportBatchesCsv();
}
export async function exportMovementsCsvAction() {
  return exportMovementsCsv();
}
