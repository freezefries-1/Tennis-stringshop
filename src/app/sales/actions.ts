"use server";

import { revalidatePath } from "next/cache";
import {
  cancelSale,
  recordSalePayment,
  returnSaleItem,
  searchCustomersForPicker,
  updateSaleCustomer,
  updateSaleDate,
  updateSaleDiscount,
  updateSaleItemAmount,
  type DiscountType,
  type PaymentMethod,
  type ReturnItemInput,
  type UpdateSaleItemAmountInput,
} from "@/lib/sales";

export async function recordPaymentAction(saleId: string, amountCents: number, paymentMethod: PaymentMethod, notes?: string) {
  await recordSalePayment({ saleId, amountCents, paymentMethod, notes });
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/dashboard");
}

export async function updateSaleDateAction(saleId: string, newDate: string) {
  await updateSaleDate(saleId, newDate);
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath(`/sales/${saleId}/receipt`);
  revalidatePath("/dashboard");
}

export async function cancelSaleAction(saleId: string, reason: string) {
  const result = await cancelSale(saleId, reason);
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return result;
}

export async function returnSaleItemAction(input: ReturnItemInput) {
  const result = await returnSaleItem(input);
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return result;
}

export async function fetchCustomersForSalePicker(query: string) {
  return searchCustomersForPicker(query);
}

export async function updateSaleCustomerAction(saleId: string, customerId: string | null) {
  const result = await updateSaleCustomer(saleId, customerId);
  if (result.ok) {
    revalidatePath("/sales");
    revalidatePath(`/sales/${saleId}`);
    revalidatePath(`/sales/${saleId}/receipt`);
    revalidatePath("/dashboard");
    revalidatePath("/reports/customers");
    if (result.previousCustomerId) revalidatePath(`/customers/${result.previousCustomerId}`);
    if (result.sale.customerId) revalidatePath(`/customers/${result.sale.customerId}`);
  }
  return result;
}

export async function updateSaleDiscountAction(saleId: string, discountType: DiscountType | null, discountValue: number | null, reason: string) {
  const result = await updateSaleDiscount(saleId, discountType, discountValue, reason);
  if (result.ok) {
    const sale = result.sale;
    revalidatePath("/sales");
    revalidatePath(`/sales/${sale.id}`);
    revalidatePath(`/sales/${sale.id}/receipt`);
    revalidatePath("/dashboard");
    revalidatePath("/reports/financial");
    if (sale.customerId) revalidatePath(`/customers/${sale.customerId}`);
  }
  return result;
}

export async function updateSaleItemAmountAction(input: UpdateSaleItemAmountInput) {
  const result = await updateSaleItemAmount(input);
  if (result.ok) {
    const sale = result.sale;
    revalidatePath("/sales");
    revalidatePath(`/sales/${sale.id}`);
    revalidatePath(`/sales/${sale.id}/receipt`);
    revalidatePath("/dashboard");
    revalidatePath("/reports/financial");
    if (sale.customerId) revalidatePath(`/customers/${sale.customerId}`);
    if (sale.stringJobId) revalidatePath(`/jobs/${sale.stringJobId}`);
  }
  return result;
}
