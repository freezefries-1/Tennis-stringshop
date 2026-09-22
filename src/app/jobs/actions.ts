"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  changeJobStatus,
  createJob,
  deleteJob,
  getJobSetupForRepeat,
  getPreviousJobForRacket,
  updateJob,
  type JobInput,
  type JobStatus,
  type ServiceInput,
  type StringSetupInput,
} from "@/lib/jobs";
import { createRacket, listRacketsForCustomer, type RacketInput } from "@/lib/rackets";
import { findCustomerByPhone, createCustomer } from "@/lib/customers";
import type { JobFormState, JobFormValues } from "@/lib/job-form-types";

function readStringLine(formData: FormData, prefix: "main" | "cross") {
  const get = (k: string) => String(formData.get(`${prefix}.${k}`) ?? "").trim();
  return {
    role: prefix,
    customerSupplied: formData.get(`${prefix}.customerSupplied`) === "true",
    brand: get("brand"),
    stringName: get("stringName"),
    gauge: get("gauge"),
    colour: get("colour"),
    tension: get("tension"),
    tensionUnit: (get("tensionUnit") || "lb") as "kg" | "lb",
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
    main: { customerSupplied: main.customerSupplied, brand: main.brand, stringName: main.stringName, gauge: main.gauge, colour: main.colour, tension: main.tension, tensionUnit: main.tensionUnit },
    cross: { customerSupplied: cross.customerSupplied, brand: cross.brand, stringName: cross.stringName, gauge: cross.gauge, colour: cross.colour, tension: cross.tension, tensionUnit: cross.tensionUnit },
    services: services.map((s) => ({ serviceName: s.serviceName, quantity: s.quantity, unitPrice: (s.unitPriceCents / 100).toFixed(2), notes: s.notes ?? "" })),
  };
}

function toInput(values: JobFormValues): JobInput {
  const mains: StringSetupInput = { role: "main", ...values.main };
  const crossSource = values.setupType === "full" ? { ...values.main, tension: values.cross.tension, tensionUnit: values.cross.tensionUnit } : values.cross;
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

function validate(values: JobFormValues): string | null {
  if (!values.customerId) return "Select a customer.";
  if (!values.customerRacketId) return "Select a racket.";
  if (!values.receivedOn) return "Date received is required.";
  if (!values.main.brand.trim() || !values.main.stringName.trim()) return "Enter the main string's brand and name.";
  if (!values.main.tension.trim()) return "Enter the main tension.";
  if (values.setupType === "hybrid") {
    if (!values.cross.brand.trim() || !values.cross.stringName.trim()) return "Enter the cross string's brand and name.";
    if (!values.cross.tension.trim()) return "Enter the cross tension.";
  } else if (!values.cross.tension.trim()) {
    return "Enter the cross tension.";
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

  await updateJob(jobId, toInput(values));
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/customers/${values.customerId}`);
  revalidatePath(`/customers/${values.customerId}/rackets/${values.customerRacketId}`);
  redirect(`/jobs/${jobId}`);
}

export async function changeJobStatusAction(jobId: string, status: JobStatus) {
  const job = await changeJobStatus(jobId, status);
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

// -- picker RPCs (src/components/jobs/*) -------------------------------

export async function fetchRacketsForCustomer(customerId: string) {
  return listRacketsForCustomer(customerId);
}

export async function fetchPreviousSetup(customerRacketId: string, excludeJobId?: string) {
  return getPreviousJobForRacket(customerRacketId, excludeJobId);
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
