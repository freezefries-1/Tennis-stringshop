"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  changeJobStatus,
  changePaymentStatus,
  createJob,
  deleteJob,
  getJobSetupForRepeat,
  getPreviousJobForRacket,
  updateJob,
  type JobInput,
  type JobPaymentStatus,
  type JobStatus,
  type ServiceInput,
  type StringSetupInput,
} from "@/lib/jobs";
import { createRacket, getRacket, listRacketsForCustomer, type RacketInput } from "@/lib/rackets";
import { findCustomerByPhone, createCustomer } from "@/lib/customers";
import { createStringProduct, searchStringProductsForPicker, type StringProductInput } from "@/lib/string-inventory";
import { getSuggestedStringUsage } from "@/lib/string-usage";
import { addProductToJobSale, recordSalePayment, type PaymentMethod } from "@/lib/sales";
import { searchProductsForPicker } from "@/lib/products";
import type { JobFormState, JobFormValues } from "@/lib/job-form-types";

function readStringLine(formData: FormData, prefix: "main" | "cross") {
  const get = (k: string) => String(formData.get(`${prefix}.${k}`) ?? "").trim();
  return {
    role: prefix,
    customerSupplied: formData.get(`${prefix}.customerSupplied`) === "true",
    stringProductId: get("stringProductId") || null,
    brand: get("brand"),
    stringName: get("stringName"),
    gauge: get("gauge"),
    colour: get("colour"),
    tension: get("tension"),
    tensionUnit: (get("tensionUnit") || "lb") as "kg" | "lb",
    quantityUsed: get("quantityUsed") || null,
    usageUnit: (get("usageUnit") || "m") as "m" | "set",
  } satisfies StringSetupInput;
}

function readServices(formData: FormData): ServiceInput[] {
  const count = Number.parseInt(String(formData.get("servicesCount") ?? "0"), 10) || 0;
  const services: ServiceInput[] = [];
  for (let i = 0; i < count; i++) {
    const serviceName = String(formData.get(`services[${i}].serviceName`) ?? "").trim();
    const unitPrice = String(formData.get(`services[${i}].unitPrice`) ?? "").trim();
    if (!serviceName && !unitPrice) continue;
    services.push({
      serviceName: serviceName || "Service",
      quantity: String(formData.get(`services[${i}].quantity`) ?? "1").trim() || "1",
      unitPriceCents: Math.round((Number.parseFloat(unitPrice) || 0) * 100),
      notes: String(formData.get(`services[${i}].notes`) ?? "").trim(),
    });
  }
  return services;
}

function readValues(formData: FormData): JobFormValues {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const main = readStringLine(formData, "main");
  const cross = readStringLine(formData, "cross");
  const services = readServices(formData);
  return {
    customerId: get("customerId"),
    customerRacketId: get("customerRacketId"),
    setupType: get("setupType") === "hybrid" ? "hybrid" : "full",
    receivedOn: get("receivedOn"),
    dueOn: get("dueOn"),
    numberOfKnots: get("numberOfKnots"),
    preStretchType: (["none", "manual", "machine"].includes(get("preStretchType")) ? get("preStretchType") : "none") as "none" | "manual" | "machine",
    preStretchPct: get("preStretchPct"),
    paymentStatus: (["unpaid", "partially_paid", "paid"].includes(get("paymentStatus")) ? get("paymentStatus") : "unpaid") as "unpaid" | "partially_paid" | "paid",
    paymentMethod: get("paymentMethod"),
    discount: get("discount"),
    generalNotes: get("generalNotes"),
    stringingNotes: get("stringingNotes"),
    main: {
      customerSupplied: main.customerSupplied,
      stringProductId: main.stringProductId ?? "",
      brand: main.brand,
      stringName: main.stringName,
      gauge: main.gauge,
      colour: main.colour,
      tension: main.tension,
      tensionUnit: main.tensionUnit,
      quantityUsed: main.quantityUsed ?? "",
      usageUnit: main.usageUnit,
    },
    cross: {
      customerSupplied: cross.customerSupplied,
      stringProductId: cross.stringProductId ?? "",
      brand: cross.brand,
      stringName: cross.stringName,
      gauge: cross.gauge,
      colour: cross.colour,
      tension: cross.tension,
      tensionUnit: cross.tensionUnit,
      quantityUsed: cross.quantityUsed ?? "",
      usageUnit: cross.usageUnit,
    },
    services: services.map((s) => ({ serviceName: s.serviceName, quantity: s.quantity, unitPrice: (s.unitPriceCents / 100).toFixed(2), notes: s.notes ?? "" })),
  };
}

function toInput(values: JobFormValues): JobInput {
  const mains: StringSetupInput = { role: "main", ...values.main };
  // A full bed is one continuous string threaded through the whole racket —
  // main/cross share brand/string/gauge/colour/source, but only the main
  // row carries the product link + quantity used. Deducting both would
  // double-count the same physical length against inventory (brief §16's
  // hybrid example implies two *independent* strings; a full bed is one).
  const crossSource =
    values.setupType === "full"
      ? { ...values.main, tension: values.cross.tension, tensionUnit: values.cross.tensionUnit, stringProductId: "", quantityUsed: "" }
      : values.cross;
  const crosses: StringSetupInput = { role: "cross", ...crossSource };
  const services: ServiceInput[] = values.services
    .filter((s) => s.serviceName.trim() || s.unitPrice.trim())
    .map((s) => ({
      serviceName: s.serviceName.trim() || "Service",
      quantity: s.quantity.trim() || "1",
      unitPriceCents: Math.round((Number.parseFloat(s.unitPrice) || 0) * 100),
      notes: s.notes.trim() || null,
    }));
  return {
    customerId: values.customerId,
    customerRacketId: values.customerRacketId,
    setupType: values.setupType,
    receivedOn: values.receivedOn,
    dueOn: values.dueOn || null,
    numberOfKnots: values.numberOfKnots ? Number.parseInt(values.numberOfKnots, 10) : null,
    preStretchType: values.preStretchType,
    preStretchPct: values.preStretchType === "machine" ? values.preStretchPct || null : null,
    paymentStatus: values.paymentStatus,
    paymentMethod: (values.paymentMethod || null) as JobInput["paymentMethod"],
    discountCents: Math.round((Number.parseFloat(values.discount) || 0) * 100),
    generalNotes: values.generalNotes || null,
    stringingNotes: values.stringingNotes || null,
    strings: [mains, crosses],
    services,
  };
}

function validateStringLine(line: JobFormValues["main"], label: string): string | null {
  if (!line.brand.trim() || !line.stringName.trim()) return `Enter the ${label} string's brand and name.`;
  if (!line.tension.trim()) return `Enter the ${label} tension.`;
  if (!line.customerSupplied) {
    if (!line.stringProductId) return `Select a string from inventory for the ${label}, or mark it customer supplied.`;
    if (!line.quantityUsed.trim() || Number(line.quantityUsed) <= 0) return `Enter how much string was used for the ${label}.`;
  }
  return null;
}

function validate(values: JobFormValues): string | null {
  if (!values.customerId) return "Select a customer.";
  if (!values.customerRacketId) return "Select a racket.";
  if (!values.receivedOn) return "Date received is required.";
  if (values.setupType === "hybrid") {
    return validateStringLine(values.main, "main") ?? validateStringLine(values.cross, "cross");
  }
  if (!values.main.brand.trim() || !values.main.stringName.trim()) return "Enter the string's brand and name.";
  if (!values.main.tension.trim()) return "Enter the main tension.";
  if (!values.cross.tension.trim()) return "Enter the cross tension.";
  if (!values.main.customerSupplied) {
    if (!values.main.stringProductId) return "Select a string from inventory, or mark it customer supplied.";
    if (!values.main.quantityUsed.trim() || Number(values.main.quantityUsed) <= 0) return "Enter how much string was used.";
  }
  return null;
}

export async function createJobAction(prevState: JobFormState, formData: FormData): Promise<JobFormState> {
  const values = readValues(formData);
  const error = validate(values);
  if (error) return { status: "error", message: error, values };

  const job = await createJob(toInput(values));
  revalidatePath("/jobs");
  revalidatePath(`/customers/${values.customerId}`);
  revalidatePath(`/customers/${values.customerId}/rackets/${values.customerRacketId}`);
  redirect(`/jobs/${job.id}`);
}

export async function updateJobAction(jobId: string, prevState: JobFormState, formData: FormData): Promise<JobFormState> {
  const values = readValues(formData);
  const error = validate(values);
  if (error) return { status: "error", message: error, values };

  const allowStockOverride = formData.get("allowStockOverride") === "true";
  const result = await updateJob(jobId, toInput(values), { allowStockOverride });
  if (!result.ok) {
    if (result.reason === "insufficient_stock") {
      return { status: "insufficient_stock", message: "Not enough stock for the updated string usage.", shortages: result.shortages, values };
    }
    if (result.reason === "sale_locked") {
      return { status: "error", message: `This job's linked sale (${result.saleCode}) already has a payment recorded, so its price/services can't be silently changed. Use the sale's own return/refund workflow for a correction.`, values };
    }
    return { status: "error", message: "This job no longer exists.", values };
  }
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/customers/${values.customerId}`);
  revalidatePath(`/customers/${values.customerId}/rackets/${values.customerRacketId}`);
  redirect(`/jobs/${jobId}`);
}

export async function changeJobStatusAction(jobId: string, status: JobStatus, allowStockOverride = false) {
  const result = await changeJobStatus(jobId, status, { allowStockOverride });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  if (result.ok) {
    revalidatePath(`/customers/${result.job.customerId}`);
    revalidatePath(`/customers/${result.job.customerId}/rackets/${result.job.customerRacketId}`);
    if (result.job.saleId) {
      revalidatePath("/sales");
      revalidatePath(`/sales/${result.job.saleId}`);
    }
  }
  return result;
}

export async function changePaymentStatusAction(jobId: string, paymentStatus: JobPaymentStatus) {
  const job = await changePaymentStatus(jobId, paymentStatus);
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  if (job) {
    revalidatePath(`/customers/${job.customerId}`);
    revalidatePath(`/customers/${job.customerId}/rackets/${job.customerRacketId}`);
  }
}

export interface DeleteJobResult {
  status: "deleted" | "in_use" | "error";
  message?: string;
}

export async function deleteJobAction(jobId: string): Promise<DeleteJobResult> {
  const result = await deleteJob(jobId);
  if (result === "in_use") {
    return { status: "in_use", message: "This job has related records and can't be deleted — cancel it instead." };
  }
  revalidatePath("/jobs");
  return { status: "deleted" };
}

// -- Phase 6: linked Sale actions ---------------------------------------

/** "Take payment" on a job with a linked Sale (brief §55) — records a
 * sale_payments row and lets the Sale derive its own paymentStatus from it.
 * Never touches stringJobs.paymentStatus (see changePaymentStatus's own
 * comment) — this is the only payment path once a Sale exists. */
export async function recordJobSalePaymentAction(saleId: string, jobId: string, amountCents: number, paymentMethod: PaymentMethod) {
  await recordSalePayment({ saleId, amountCents, paymentMethod });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/sales/${saleId}`);
}

/** "Add product" on a job's linked Sale (brief §29) — a small retail item
 * bought at the same visit (an overgrip, a dampener) flows into the SAME
 * Sale instead of needing a second POS checkout. */
export async function addProductToJobSaleAction(saleId: string, jobId: string, productId: string, quantity: number) {
  const result = await addProductToJobSale(saleId, productId, quantity);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/sales/${saleId}`);
  return result;
}

export async function fetchProductsForJobPicker(query: string) {
  return searchProductsForPicker(query);
}

// -- picker RPCs (src/components/jobs/*) -------------------------------

export async function fetchRacketsForCustomer(customerId: string) {
  return listRacketsForCustomer(customerId);
}

export async function fetchPreviousSetup(customerRacketId: string, excludeJobId?: string) {
  return getPreviousJobForRacket(customerRacketId, excludeJobId);
}

/** Suggested string usage for a racket (specific model → string pattern →
 * global default, in that order — see getSuggestedStringUsage). Only ever
 * pre-fills the job form's editable quantity field; the actual saved
 * amount, not this suggestion, is what inventory deduction and COGS use. */
export async function fetchSuggestedStringUsage(customerRacketId: string) {
  const result = await getRacket(customerRacketId);
  if (!result) return null;
  return getSuggestedStringUsage(result.racket);
}

export async function fetchJobSetupForRepeat(jobId: string) {
  return getJobSetupForRepeat(jobId);
}

/** Quick-add from inside the New String Job workflow — reuses an existing
 * customer by phone instead of warning, unlike the full Customer form's
 * duplicate check, since this is deliberately a no-interruption fast path
 * (brief §5: "Do not make me restart the job"). */
export async function quickCreateCustomerForJob(name: string, phone: string) {
  const existing = await findCustomerByPhone(phone);
  if (existing) return existing;
  return createCustomer({ name, phone });
}

export async function quickCreateRacketForJob(customerId: string, input: RacketInput) {
  return createRacket(customerId, input);
}

/** The SportCraft Stock string picker (StringSetupSection) — search-as-you-
 * type, showing live stock (brief §18). */
export async function fetchStringProductsForPicker(query: string) {
  return searchStringProductsForPicker(query);
}

/** Quick-add a new String Product from inside the job form, same "don't
 * make me leave the job" reasoning as quickCreateRacketForJob — creates
 * only the catalogue entry, not stock (receiving stock is a separate,
 * deliberate workflow at /inventory). */
export async function quickCreateStringProductForJob(input: StringProductInput) {
  return createStringProduct(input);
}
