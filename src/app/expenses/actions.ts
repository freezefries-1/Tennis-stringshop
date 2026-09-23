"use server";

import { revalidatePath } from "next/cache";
import {
  createExpense,
  createExpenseCategory,
  deleteExpenseCategory,
  ensureDefaultExpenseCategories,
  exportExpensesCsv,
  findPossibleDuplicateExpense,
  getExpense,
  importExpenses,
  listExpenseAuditLog,
  listExpenseCategories,
  listExpensesPage,
  listVendorsInUse,
  parseExpenseImportCsv,
  renameExpenseCategory,
  setExpenseCategoryArchived,
  updateExpense,
  voidExpense,
  type ExpenseImportRow,
  type ExpenseInput,
  type ExpensePageParams,
} from "@/lib/expenses";

export async function fetchVendorsInUse() {
  return listVendorsInUse();
}

export async function fetchExpenseCategories(includeArchived = false) {
  await ensureDefaultExpenseCategories();
  return listExpenseCategories(includeArchived);
}

export async function createExpenseCategoryAction(name: string) {
  const category = await createExpenseCategory(name);
  revalidatePath("/expenses");
  revalidatePath("/expenses/categories");
  return category;
}

export async function renameExpenseCategoryAction(id: string, name: string) {
  await renameExpenseCategory(id, name);
  revalidatePath("/expenses/categories");
}

export async function setExpenseCategoryArchivedAction(id: string, archived: boolean) {
  await setExpenseCategoryArchived(id, archived);
  revalidatePath("/expenses/categories");
}

export async function deleteExpenseCategoryAction(id: string) {
  const result = await deleteExpenseCategory(id);
  revalidatePath("/expenses/categories");
  return result;
}

export interface SaveExpenseResult {
  status: "saved" | "duplicate" | "voided" | "not_found";
  expenseId?: string;
  duplicateExpenseNumber?: string;
}

export async function checkExpenseDuplicateAction(expenseDate: string, vendor: string | null, amountCents: number, description: string, excludeId?: string) {
  const dup = await findPossibleDuplicateExpense(expenseDate, vendor, amountCents, description, excludeId);
  return dup ? { expenseNumber: dup.expenseNumber } : null;
}

export async function createExpenseAction(input: ExpenseInput): Promise<SaveExpenseResult> {
  const expense = await createExpense(input);
  revalidatePath("/expenses");
  return { status: "saved", expenseId: expense.id };
}

export async function updateExpenseAction(id: string, input: ExpenseInput): Promise<SaveExpenseResult> {
  const result = await updateExpense(id, input);
  if (!result.ok) return { status: result.reason === "voided" ? "voided" : "not_found" };
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
  return { status: "saved", expenseId: id };
}

export async function voidExpenseAction(id: string, reason: string) {
  const result = await voidExpense(id, reason);
  revalidatePath("/expenses");
  revalidatePath(`/expenses/${id}`);
  return result;
}

export async function fetchExpense(id: string) {
  return getExpense(id);
}

export async function fetchExpenseAuditLog(expenseId: string) {
  return listExpenseAuditLog(expenseId);
}

export async function listExpensesPageAction(params: ExpensePageParams) {
  return listExpensesPage(params);
}

export async function exportExpensesCsvAction(filters: Parameters<typeof exportExpensesCsv>[0]) {
  return exportExpensesCsv(filters);
}

export async function parseExpenseImportCsvAction(csvText: string): Promise<ExpenseImportRow[]> {
  return parseExpenseImportCsv(csvText);
}

export async function importExpensesAction(rows: Parameters<typeof importExpenses>[0]) {
  const result = await importExpenses(rows);
  revalidatePath("/expenses");
  return result;
}
