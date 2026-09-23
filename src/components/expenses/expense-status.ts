import type { ExpenseStatus, ExpenseTreatment } from "@/lib/expenses";
import type { RecurringFrequency } from "@/lib/recurring-expenses";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";

export const EXPENSE_STATUS_LABEL: Record<ExpenseStatus, string> = {
  recorded: "Recorded",
  voided: "Voided",
};

export const EXPENSE_STATUS_TONE: Record<ExpenseStatus, BadgeTone> = {
  recorded: "success",
  voided: "danger",
};

export const EXPENSE_TREATMENT_LABEL: Record<ExpenseTreatment, string> = {
  operating: "Operating expense",
  capital: "Capital / Equipment",
};

export const EXPENSE_TREATMENT_TONE: Record<ExpenseTreatment, BadgeTone> = {
  operating: "neutral",
  capital: "info",
};

/** Options offered on the Add/Edit Expense form — distinct from Sales'
 * paymentMethodEnum (brief §10: also offer Personal Card / Business Card),
 * plain strings rather than an enum so this list can be extended without a
 * migration. */
export const EXPENSE_PAYMENT_METHODS = ["PayNow", "Cash", "Bank transfer", "Card", "Personal card", "Business card", "Other"];

export const RECURRING_FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};
