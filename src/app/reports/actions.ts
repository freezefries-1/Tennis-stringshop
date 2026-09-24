"use server";

import { exportMonthlyTrendCsv } from "@/lib/financials";
import { exportStringUsageCsv } from "@/lib/reports-stringing";
import { exportProductAnalyticsCsv } from "@/lib/reports-products";
import { exportCustomerPerformanceCsv } from "@/lib/reports-customers";
import { exportInventoryAnalysisCsv } from "@/lib/reports-inventory";
import { exportExpensesCsv } from "@/lib/expenses";
import type { FinancialsFilters } from "@/lib/financials";
import type { ExpenseFilters } from "@/lib/expenses";

export async function exportMonthlyTrendCsvAction(monthsBack: number) {
  return exportMonthlyTrendCsv(monthsBack);
}

export async function exportStringUsageCsvAction(filters: FinancialsFilters) {
  return exportStringUsageCsv(filters);
}

export async function exportProductAnalyticsCsvAction(filters: FinancialsFilters) {
  return exportProductAnalyticsCsv(filters);
}

export async function exportCustomerPerformanceCsvAction(filters: FinancialsFilters) {
  return exportCustomerPerformanceCsv(filters);
}

export async function exportInventoryAnalysisCsvAction() {
  return exportInventoryAnalysisCsv();
}

export async function exportExpenseAnalysisCsvAction(filters: ExpenseFilters) {
  return exportExpensesCsv(filters);
}
