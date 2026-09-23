"use server";

import { revalidatePath } from "next/cache";
import {
  createOtherIncome,
  exportOtherIncomeCsv,
  getOtherIncome,
  listCategoriesInUse,
  listCategoriesWithCounts,
  listOtherIncomeAuditLog,
  listOtherIncomePage,
  renameOtherIncomeCategory,
  updateOtherIncome,
  voidOtherIncome,
  type OtherIncomeInput,
  type OtherIncomePageParams,
} from "@/lib/other-income";

export async function fetchCategoriesInUse() {
  return listCategoriesInUse();
}

export async function fetchCategoriesWithCounts() {
  return listCategoriesWithCounts();
}

export async function renameOtherIncomeCategoryAction(oldCategory: string, newCategory: string) {
  const count = await renameOtherIncomeCategory(oldCategory, newCategory);
  revalidatePath("/other-income");
  revalidatePath("/other-income/categories");
  return { count };
}

export interface SaveOtherIncomeResult {
  status: "saved" | "voided" | "not_found";
  incomeId?: string;
}

export async function createOtherIncomeAction(input: OtherIncomeInput): Promise<SaveOtherIncomeResult> {
  const income = await createOtherIncome(input);
  revalidatePath("/other-income");
  return { status: "saved", incomeId: income.id };
}

export async function updateOtherIncomeAction(id: string, input: OtherIncomeInput): Promise<SaveOtherIncomeResult> {
  const result = await updateOtherIncome(id, input);
  if (!result.ok) return { status: result.reason === "voided" ? "voided" : "not_found" };
  revalidatePath("/other-income");
  revalidatePath(`/other-income/${id}`);
  return { status: "saved", incomeId: id };
}

export async function voidOtherIncomeAction(id: string, reason: string) {
  const result = await voidOtherIncome(id, reason);
  revalidatePath("/other-income");
  revalidatePath(`/other-income/${id}`);
  return result;
}

export async function fetchOtherIncome(id: string) {
  return getOtherIncome(id);
}

export async function fetchOtherIncomeAuditLog(id: string) {
  return listOtherIncomeAuditLog(id);
}

export async function listOtherIncomePageAction(params: OtherIncomePageParams) {
  return listOtherIncomePage(params);
}

export async function exportOtherIncomeCsvAction(filters: Parameters<typeof exportOtherIncomeCsv>[0]) {
  return exportOtherIncomeCsv(filters);
}
