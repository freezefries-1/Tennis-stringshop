import type { OtherIncomeStatus } from "@/lib/other-income";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";

export const OTHER_INCOME_STATUS_LABEL: Record<OtherIncomeStatus, string> = {
  recorded: "Recorded",
  voided: "Voided",
};

export const OTHER_INCOME_STATUS_TONE: Record<OtherIncomeStatus, BadgeTone> = {
  recorded: "success",
  voided: "danger",
};

/** Same option list as Expenses' payment method field — kept as a separate
 * constant rather than importing Expenses' so the two can diverge later
 * without coupling. */
export const OTHER_INCOME_PAYMENT_METHODS = ["PayNow", "Cash", "Bank transfer", "Card", "Personal card", "Business card", "Other"];

/** Suggested starting points for the free-text category field — not an
 * enforced enum, just what the datalist offers first (mirrors Expenses'
 * vendor autocomplete, one level up). Lives here (not lib/other-income.ts)
 * so the Client Component form can import it without pulling in that
 * module's `db` import — see racket-label.ts for the same reasoning. */
export const SUGGESTED_OTHER_INCOME_CATEGORIES = ["Equipment / asset sale", "Refund / rebate received", "Interest income", "Other"];
