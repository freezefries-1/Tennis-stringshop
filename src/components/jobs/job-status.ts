import type { JobPaymentStatus, JobStatus } from "@/lib/jobs";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";

export const JOB_STATUSES: JobStatus[] = ["received", "waiting", "in_progress", "completed", "collected", "cancelled"];

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  received: "Received",
  waiting: "Waiting",
  in_progress: "In progress",
  completed: "Completed",
  collected: "Collected",
  cancelled: "Cancelled",
};

export const JOB_STATUS_TONE: Record<JobStatus, BadgeTone> = {
  received: "neutral",
  waiting: "info",
  in_progress: "brand",
  completed: "success",
  collected: "success",
  cancelled: "danger",
};

export const PAYMENT_STATUS_LABEL: Record<JobPaymentStatus, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
};

export const PAYMENT_STATUS_TONE: Record<JobPaymentStatus, BadgeTone> = {
  unpaid: "warning",
  partially_paid: "info",
  paid: "success",
};
