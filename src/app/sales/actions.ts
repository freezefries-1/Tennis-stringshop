"use server";

import { revalidatePath } from "next/cache";
import { cancelSale, recordSalePayment, returnSaleItem, updateSaleDate, type PaymentMethod, type ReturnItemInput } from "@/lib/sales";

export async function recordPaymentAction(saleId: string, amountCents: number, paymentMethod: PaymentMethod, notes?: string) {
  await recordSalePayment({ saleId, amountCents, paymentMethod, notes });
  revalidatePath("/sales");
  revalidatePath(`/sales/${saleId}`);
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
  return result;
}

export async function returnSaleItemAction(input: ReturnItemInput) {
  const result = await returnSaleItem(input);
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/inventory");
  return result;
}
