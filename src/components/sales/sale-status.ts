import type { SalePaymentStatus, SaleStatus } from "@/lib/sales";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";

export const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  partially_refunded: "Partially refunded",
};

export const SALE_STATUS_TONE: Record<SaleStatus, BadgeTone> = {
  draft: "neutral",
  completed: "success",
  cancelled: "danger",
  refunded: "warning",
  partially_refunded: "warning",
};

export const SALE_PAYMENT_STATUS_LABEL: Record<SalePaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
  refunded: "Refunded",
};

export const SALE_PAYMENT_STATUS_TONE: Record<SalePaymentStatus, BadgeTone> = {
  unpaid: "warning",
  partially_paid: "info",
  paid: "success",
  refunded: "neutral",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  paynow: "PayNow",
  cash: "Cash",
  transfer: "Bank transfer",
  card: "Card",
  other: "Other",
};
