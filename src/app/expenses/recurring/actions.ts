"use server";

import { revalidatePath } from "next/cache";
import {
  createRecurringExpense,
  generateAllDueExpenses,
  generateDueExpense,
  getRecurringExpense,
  listRecurringExpenses,
  setRecurringExpenseActive,
  updateRecurringExpense,
  type RecurringExpenseInput,
} from "@/lib/recurring-expenses";

export async function fetchRecurringExpenses(includeInactive = false) {
  return listRecurringExpenses(includeInactive);
}

export async function fetchRecurringExpense(id: string) {
  return getRecurringExpense(id);
}

export async function createRecurringExpenseAction(input: RecurringExpenseInput) {
  const row = await createRecurringExpense(input);
  revalidatePath("/expenses/recurring");
  return row;
}

export async function updateRecurringExpenseAction(id: string, input: RecurringExpenseInput) {
  const row = await updateRecurringExpense(id, input);
  revalidatePath("/expenses/recurring");
  revalidatePath(`/expenses/recurring/${id}`);
  return row;
}

export async function setRecurringExpenseActiveAction(id: string, active: boolean) {
  await setRecurringExpenseActive(id, active);
  revalidatePath("/expenses/recurring");
}

export async function generateDueExpenseAction(id: string) {
  const result = await generateDueExpense(id);
  revalidatePath("/expenses/recurring");
  revalidatePath("/expenses");
  return result;
}

export async function generateAllDueExpensesAction() {
  const result = await generateAllDueExpenses();
  revalidatePath("/expenses/recurring");
  revalidatePath("/expenses");
  return result;
}
