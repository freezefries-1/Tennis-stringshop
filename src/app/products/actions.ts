"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  createProductCategory,
  deleteProduct,
  deleteProductCategory,
  ensureDefaultCategories,
  findDuplicateProduct,
  InsufficientStockError,
  listProductCategories,
  listProducts,
  receiveProductStock,
  recordManualAdjustment,
  renameProductCategory,
  setProductArchived,
  setProductCategoryArchived,
  updateProduct,
  updateProductBatchCost,
  exportProductsCsv,
  exportProductBatchesCsv,
  exportProductMovementsCsv,
  type ManualAdjustmentInput,
  type ProductInput,
  type ReceiveProductStockInput,
  type UpdateProductBatchCostInput,
} from "@/lib/products";
import { listSuppliers, createSupplier } from "@/lib/string-inventory";

export async function fetchAllActiveProducts() {
  return listProducts({ includeArchived: false });
}

export async function fetchProductCategories(includeArchived = false) {
  await ensureDefaultCategories();
  return listProductCategories(includeArchived);
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

export async function createProductAction(input: ProductInput, allowDuplicate = false): Promise<SaveProductResult> {
  if (!allowDuplicate) {
    const dup = await findDuplicateProduct(input.name, input.brand ?? null, input.variant ?? null);
    if (dup) return { status: "duplicate", duplicateLabel: `${dup.brand ?? ""} ${dup.name}${dup.variant ? ` (${dup.variant})` : ""}`.trim() };
  }
  const product = await createProduct(input);
  revalidatePath("/products");
  return { status: "saved", productId: product.id };
}

export async function updateProductAction(id: string, input: ProductInput, allowDuplicate = false): Promise<SaveProductResult> {
  if (!allowDuplicate) {
    const dup = await findDuplicateProduct(input.name, input.brand ?? null, input.variant ?? null, id);
    if (dup) return { status: "duplicate", duplicateLabel: `${dup.brand ?? ""} ${dup.name}${dup.variant ? ` (${dup.variant})` : ""}`.trim() };
  }
  await updateProduct(id, input);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { status: "saved", productId: id };
}

export async function setProductArchivedAction(id: string, archived: boolean) {
  await setProductArchived(id, archived);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

export interface DeleteProductResult {
  status: "deleted" | "in_use";
}

export async function deleteProductAction(id: string): Promise<DeleteProductResult> {
  const result = await deleteProduct(id);
  if (result === "in_use") return { status: "in_use" };
  revalidatePath("/products");
  return { status: "deleted" };
}

export async function receiveProductStockAction(input: ReceiveProductStockInput) {
  const result = await receiveProductStock(input);
  revalidatePath("/products");
  revalidatePath(`/products/${input.productId}`);
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
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { status: "ok" };
}

export async function updateProductBatchCostAction(input: UpdateProductBatchCostInput, productId: string) {
  await updateProductBatchCost(input);
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  return { status: "ok" as const };
}

// -- categories --------------------------------------------------------

export interface SaveCategoryResult {
  status: "created" | "duplicate";
  category?: Awaited<ReturnType<typeof createProductCategory>>;
}

export async function createProductCategoryAction(name: string): Promise<SaveCategoryResult> {
  const created = await createProductCategory(name);
  revalidatePath("/products");
  revalidatePath("/products/categories");
  return { status: "created", category: created };
}

export async function renameProductCategoryAction(id: string, name: string) {
  await renameProductCategory(id, name);
  revalidatePath("/products");
  revalidatePath("/products/categories");
}

export async function setProductCategoryArchivedAction(id: string, archived: boolean) {
  await setProductCategoryArchived(id, archived);
  revalidatePath("/products");
  revalidatePath("/products/categories");
}

export async function deleteProductCategoryAction(id: string) {
  const result = await deleteProductCategory(id);
  revalidatePath("/products/categories");
  return result;
}

// -- CSV export --------------------------------------------------------

export async function exportProductsCsvAction() {
  return exportProductsCsv();
}
export async function exportProductBatchesCsvAction() {
  return exportProductBatchesCsv();
}
export async function exportProductMovementsCsvAction() {
  return exportProductMovementsCsv();
}
