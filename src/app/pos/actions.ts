"use server";

import { revalidatePath } from "next/cache";
import { searchProductsForPicker } from "@/lib/products";
import { searchStringProductsForPicker } from "@/lib/string-inventory";
import { createSale, searchCustomersForPicker, type CreateSaleInput, type CreateSaleResult } from "@/lib/sales";
import { findCustomerByPhone, createCustomer } from "@/lib/customers";

export async function fetchCustomersForPos(query: string) {
  return searchCustomersForPicker(query);
}

/** Same no-interruption quick-add as the job form's customer picker (brief
 * §14 — "do not force me to create a customer just to sell a can of tennis
 * balls"), reusing an existing customer by phone rather than warning. */
export async function quickCreateCustomerForPos(name: string, phone: string) {
  const existing = await findCustomerByPhone(phone);
  if (existing) return existing;
  return createCustomer({ name, phone });
}

export interface PosSearchResult {
  key: string;
  kind: "product" | "string_product";
  id: string;
  label: string;
  sublabel: string;
  priceCents: number | null;
  available: number | string;
  unit: string;
  /** Set only for an 'm'-tracked string product that also has a reel
   * length/price configured — lets the POS cart offer "sell as: metres /
   * whole reel(s)" for this line. */
  reelLengthM?: number | null;
  reelSellingPriceCents?: number | null;
}

/** One merged search across both catalogues (brief §15) — a general retail
 * product AND a string reel/set are both things POS can sell, but they
 * stay two separate lookups under the hood (brief §10), just presented
 * together here. */
export async function searchPosItems(query: string): Promise<PosSearchResult[]> {
  if (!query.trim()) return [];
  const [products, strings] = await Promise.all([searchProductsForPicker(query), searchStringProductsForPicker(query)]);
  const productResults: PosSearchResult[] = products
    .filter((p) => !p.archivedAt)
    .map((p) => ({
      key: `product:${p.id}`,
      kind: "product",
      id: p.id,
      label: p.label,
      sublabel: p.categoryName,
      priceCents: p.defaultSellingPriceCents,
      available: p.trackInventory ? p.available : "∞",
      unit: "unit",
    }));
  const stringResults: PosSearchResult[] = strings
    .filter((p) => !p.archivedAt)
    .map((p) => ({
      key: `string_product:${p.id}`,
      kind: "string_product",
      id: p.id,
      label: p.label,
      sublabel: p.trackingUnit === "set" ? "String set" : "String reel",
      priceCents: p.defaultSellingPriceCents,
      available: p.available,
      unit: p.trackingUnit,
      reelLengthM: p.reelLengthM != null ? Number(p.reelLengthM) : null,
      reelSellingPriceCents: p.reelSellingPriceCents,
    }));
  return [...productResults, ...stringResults];
}

export async function createSaleAction(input: CreateSaleInput): Promise<CreateSaleResult> {
  const result = await createSale(input);
  if (result.ok) {
    revalidatePath("/sales");
    revalidatePath("/products");
    revalidatePath("/inventory");
    if (input.customerId) revalidatePath(`/customers/${input.customerId}`);
  }
  return result;
}
