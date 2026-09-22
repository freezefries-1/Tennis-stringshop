"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCustomer, findCustomerByPhone, updateCustomer, type CustomerInput } from "@/lib/customers";
import type { CustomerFormState, CustomerFormValues } from "@/lib/customer-form-types";

function readValues(formData: FormData): CustomerFormValues {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  };
}

function toInput(values: CustomerFormValues): CustomerInput {
  return { name: values.name, phone: values.phone, email: values.email || null, notes: values.notes || null };
}

export async function createCustomerAction(prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const values = readValues(formData);
  const force = formData.get("force") === "true";

  if (!values.name || !values.phone) {
    return { status: "error", message: "Name and phone are required.", values };
  }

  if (!force) {
    const existing = await findCustomerByPhone(values.phone);
    if (existing) {
      return { status: "duplicate", duplicate: { id: existing.id, name: existing.name, code: existing.code }, values };
    }
  }

  const created = await createCustomer(toInput(values));
  revalidatePath("/customers");
  redirect(`/customers/${created.id}`);
}

export async function updateCustomerAction(id: string, prevState: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const values = readValues(formData);
  const force = formData.get("force") === "true";

  if (!values.name || !values.phone) {
    return { status: "error", message: "Name and phone are required.", values };
  }

  if (!force) {
    const existing = await findCustomerByPhone(values.phone, id);
    if (existing) {
      return { status: "duplicate", duplicate: { id: existing.id, name: existing.name, code: existing.code }, values };
    }
  }

  await updateCustomer(id, toInput(values));
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}
