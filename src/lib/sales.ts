import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customers, productInventoryMovements, products, saleItems, salePayments, sales, stringInventoryMovements, stringJobs, stringProducts } from "@/db/schema";
import {
  allocateProductForSaleItem,
  getProduct,
  InsufficientStockError as ProductInsufficientStockError,
  previewProductStock,
  reverseAllocationsForSaleItem,
} from "./products";
import { allocateStringForSale, getStringProduct, InsufficientStockError as StringInsufficientStockError, previewStock as previewStringStock, reverseStringSaleItem } from "./string-inventory";
import { isUniqueViolation } from "./db-errors";

// -- revenue recognition & double-counting (read this before editing) ------
//
// A Sale is the ONLY place revenue is counted from Phase 6 on (brief §26,
// §70 — the mandatory "financial source of truth" test). A string_jobs row
// still carries its own finalPriceCents/paymentStatus, but those are the
// operational quote and day-to-day tracking, not revenue — nothing in this
// codebase sums stringJobs.finalPriceCents into a total alongside
// sales.totalCents. src/lib/customers.ts's lifetimeSpendCents already only
// reads `sales` (has done since before this phase); the dashboard's sales
// stats below do too.
//
// The mechanism that makes double-billing structurally impossible, not
// just a convention: sales.stringJobId is UNIQUE. A string job can create
// at most one linked Sale, ever — createJobSale below is the only writer,
// called from changeJobStatus (src/lib/jobs.ts) the first time a job
// reaches "completed", guarded by the same inventoryProcessedAt
// idempotency lock Phase 5 already uses (so "mark completed" twice, a
// refresh, or a concurrent double-click still produces exactly one Sale,
// exactly like it already produces exactly one inventory deduction). A
// second attempt to link the same job hits that UNIQUE constraint and
// fails loudly instead of quietly creating a duplicate revenue row.
//
// A POS retail sale and a string-job sale are otherwise the same kind of
// row — this file has no separate "job revenue" total anywhere; a job's
// revenue simply IS its linked Sale's totalCents, read like any other Sale.

export type Sale = typeof sales.$inferSelect;
export type SaleItem = typeof saleItems.$inferSelect;
export type SalePayment = typeof salePayments.$inferSelect;
export type SaleStatus = Sale["status"];
export type SalePaymentStatus = Sale["paymentStatus"];
export type SaleItemType = SaleItem["itemType"];
export type DiscountType = NonNullable<Sale["discountType"]>;
export type PaymentMethod = SalePayment["paymentMethod"];

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

function resolveDiscountCents(baseCents: number, type: DiscountType | null | undefined, value: number | null | undefined): number {
  if (!type || value == null || Number.isNaN(value)) return 0;
  const raw = type === "percent" ? Math.round(baseCents * (value / 100)) : Math.round(value * 100);
  return Math.max(0, Math.min(raw, baseCents));
}

// -- checkout (POS + retail) -------------------------------------------------

export interface CartLineInput {
  itemType: "product" | "string_product" | "custom";
  productId?: string | null;
  stringProductId?: string | null;
  /** Required for 'custom'; an optional override for product/string_product
   * (rare — the catalogue label is used by default). */
  descriptionOverride?: string | null;
  quantity: number;
  /** The actual price charged, in cents — already reflects any manual
   * override (brief §20); the catalogue's own current price is looked up
   * separately and snapshotted as standardPriceCentsSnapshot for
   * comparison, never overwritten by this. */
  unitPriceCents: number;
  /** Resolved line-level discount amount, in cents (brief §19) — the
   * caller (POS UI) is responsible for turning a percent/fixed choice into
   * this one number, the same way the sale-level discount is resolved
   * server-side from discountType/discountValue below. */
  discountCents?: number;
  /** Custom items only — COGS defaults to 0 (brief §17) unless given. */
  manualCogsCents?: number | null;
  /** string_product lines only — when set, this is how much to deduct
   * from string inventory (in the product's native tracking unit),
   * overriding `quantity` for that purpose. Lets a line's `quantity` mean
   * "reels sold" (for pricing/receipt) while inventory is still deducted
   * in the metres a reel actually contains — e.g. quantity=1 reel,
   * inventoryQuantityOverride=200 (m) for a 200m reel. Omitted/null means
   * `quantity` itself is already in the native unit (the ordinary
   * cut-to-length case). */
  inventoryQuantityOverride?: number | null;
}

export interface CreateSaleInput {
  customerId?: string | null;
  items: CartLineInput[];
  discountType?: DiscountType | null;
  discountValue?: number | null;
  initialPaymentCents?: number | null;
  initialPaymentMethod?: PaymentMethod | null;
  notes?: string | null;
  allowStockOverride?: boolean;
  /** Idempotency (brief §51) — generated once per checkout attempt by the
   * POS UI and resent unchanged on a retry/double-click. */
  clientRequestId: string;
}

export interface SaleStockShortage {
  itemIndex: number;
  label: string;
  neededQty: number;
  availableQty: number;
  unit: "unit" | "m" | "set";
}

export type CreateSaleResult = { ok: true; sale: Sale } | { ok: false; reason: "empty_cart" } | { ok: false; reason: "insufficient_stock"; shortages: SaleStockShortage[] };

async function previewLineStock(line: CartLineInput, index: number): Promise<SaleStockShortage | null> {
  if (line.itemType === "product" && line.productId) {
    const product = await getProduct(line.productId);
    if (!product || !product.trackInventory) return null;
    const { sufficient, available } = await previewProductStock(line.productId, line.quantity);
    if (sufficient) return null;
    return { itemIndex: index, label: [product.brand, product.name, product.variant].filter(Boolean).join(" "), neededQty: line.quantity, availableQty: available, unit: "unit" };
  }
  if (line.itemType === "string_product" && line.stringProductId) {
    const product = await getStringProduct(line.stringProductId);
    if (!product) return null;
    const neededQty = line.inventoryQuantityOverride ?? line.quantity;
    const { sufficient, available } = await previewStringStock(line.stringProductId, neededQty);
    if (sufficient) return null;
    return { itemIndex: index, label: [product.brand, product.name, product.gauge ? `${product.gauge}mm` : null, product.colour].filter(Boolean).join(" "), neededQty, availableQty: available, unit: product.trackingUnit };
  }
  return null;
}

/** One POS checkout — creates the Sale, its Sale Items, FIFO-allocates and
 * deducts inventory for every product/string_product line, records an
 * initial payment if given, and derives paymentStatus from it. All in one
 * transaction (brief §50): a Sale is never left half-created with its
 * inventory deduction missing, or vice versa. Idempotent (brief §51) via
 * clientRequestId — a retry with the same id returns the original Sale
 * instead of creating a second one, whether it's caught by the pre-check
 * lookup or (under a race) by the unique constraint itself. */
export async function createSale(input: CreateSaleInput): Promise<CreateSaleResult> {
  if (input.items.length === 0) return { ok: false, reason: "empty_cart" };

  const [existing] = await db.select().from(sales).where(eq(sales.clientRequestId, input.clientRequestId)).limit(1);
  if (existing) return { ok: true, sale: existing };

  if (!input.allowStockOverride) {
    const shortages: SaleStockShortage[] = [];
    for (let i = 0; i < input.items.length; i++) {
      const shortage = await previewLineStock(input.items[i], i);
      if (shortage) shortages.push(shortage);
    }
    if (shortages.length) return { ok: false, reason: "insufficient_stock", shortages };
  }

  try {
    const sale = await db.transaction(async (tx) => {
      const lineComputations = input.items.map((line) => {
        const lineTotalCents = Math.max(0, Math.round(line.unitPriceCents * line.quantity) - (line.discountCents ?? 0));
        return { line, lineTotalCents };
      });
      const subtotalCents = lineComputations.reduce((sum, l) => sum + l.lineTotalCents, 0);
      const discountCents = resolveDiscountCents(subtotalCents, input.discountType, input.discountValue);
      const totalCents = subtotalCents - discountCents;

      const [sale] = await tx
        .insert(sales)
        .values({
          customerId: input.customerId || null,
          occurredAt: new Date(),
          status: "completed",
          subtotalCents,
          discountType: input.discountType || null,
          discountValue: input.discountValue != null ? input.discountValue.toFixed(2) : null,
          discountCents,
          totalCents,
          notes: input.notes?.trim() || null,
          clientRequestId: input.clientRequestId,
        })
        .returning();

      for (const { line, lineTotalCents } of lineComputations) {
        if (line.itemType === "product" && line.productId) {
          const product = await getProduct(line.productId);
          if (!product) throw new Error("Product not found");
          const [item] = await tx
            .insert(saleItems)
            .values({
              saleId: sale.id,
              itemType: "product",
              productId: product.id,
              descriptionSnapshot: line.descriptionOverride?.trim() || [product.brand, product.name, product.variant].filter(Boolean).join(" "),
              skuSnapshot: product.sku,
              quantity: String(line.quantity),
              standardPriceCentsSnapshot: product.defaultSellingPriceCents ?? line.unitPriceCents,
              unitPriceCents: line.unitPriceCents,
              discountCents: line.discountCents ?? 0,
              lineTotalCents,
              grossProfitCents: lineTotalCents,
            })
            .returning();
          let cogsCents = 0;
          if (product.trackInventory) {
            const result = await allocateProductForSaleItem({ tx, productId: product.id, saleItemId: item.id, quantityNeeded: line.quantity, allowOverride: !!input.allowStockOverride, saleId: sale.id });
            cogsCents = result.cogsCents;
          } else {
            cogsCents = Math.round((product.costPriceCents ?? 0) * line.quantity);
          }
          await tx.update(saleItems).set({ cogsAmountCents: cogsCents, grossProfitCents: lineTotalCents - cogsCents }).where(eq(saleItems.id, item.id));
        } else if (line.itemType === "string_product" && line.stringProductId) {
          const product = await getStringProduct(line.stringProductId);
          if (!product) throw new Error("String product not found");
          const baseDescription = line.descriptionOverride?.trim() || [product.brand, product.name, product.gauge ? `${product.gauge}mm` : null, product.colour].filter(Boolean).join(" ");
          const [item] = await tx
            .insert(saleItems)
            .values({
              saleId: sale.id,
              itemType: "string_product",
              stringProductId: product.id,
              descriptionSnapshot: baseDescription + (line.inventoryQuantityOverride != null ? " (reel)" : ""),
              skuSnapshot: product.sku,
              quantity: String(line.quantity),
              standardPriceCentsSnapshot: (line.inventoryQuantityOverride != null ? product.reelSellingPriceCents : product.defaultSellingPriceCents) ?? line.unitPriceCents,
              unitPriceCents: line.unitPriceCents,
              discountCents: line.discountCents ?? 0,
              lineTotalCents,
              grossProfitCents: lineTotalCents,
            })
            .returning();
          const { cogsCents } = await allocateStringForSale({
            tx,
            stringProductId: product.id,
            saleId: sale.id,
            saleItemId: item.id,
            quantityNeeded: line.inventoryQuantityOverride ?? line.quantity,
            unit: product.trackingUnit,
            allowOverride: !!input.allowStockOverride,
          });
          await tx.update(saleItems).set({ cogsAmountCents: cogsCents, grossProfitCents: lineTotalCents - cogsCents }).where(eq(saleItems.id, item.id));
        } else {
          const cogsCents = line.manualCogsCents ?? 0;
          await tx.insert(saleItems).values({
            saleId: sale.id,
            itemType: "custom",
            descriptionSnapshot: line.descriptionOverride?.trim() || "Custom item",
            quantity: String(line.quantity),
            standardPriceCentsSnapshot: line.unitPriceCents,
            unitPriceCents: line.unitPriceCents,
            discountCents: line.discountCents ?? 0,
            lineTotalCents,
            cogsAmountCents: cogsCents,
            grossProfitCents: lineTotalCents - cogsCents,
          });
        }
      }

      if (input.initialPaymentCents && input.initialPaymentCents > 0 && input.initialPaymentMethod) {
        await tx.insert(salePayments).values({ saleId: sale.id, amountCents: input.initialPaymentCents, paymentMethod: input.initialPaymentMethod });
      }
      const paymentStatus = await recalcSalePaymentStatus(tx, sale.id);

      const [final] = await tx.select().from(sales).where(eq(sales.id, sale.id)).limit(1);
      return { ...final, paymentStatus };
    });
    return { ok: true, sale };
  } catch (err) {
    if (isUniqueViolation(err)) {
      const [race] = await db.select().from(sales).where(eq(sales.clientRequestId, input.clientRequestId)).limit(1);
      if (race) return { ok: true, sale: race };
    }
    if (err instanceof ProductInsufficientStockError || err instanceof StringInsufficientStockError) {
      return { ok: false, reason: "insufficient_stock", shortages: [{ itemIndex: -1, label: "An item in this sale", neededQty: err.needed, availableQty: err.available, unit: "unit" }] };
    }
    throw err;
  }
}

// -- payments ----------------------------------------------------------------

async function recalcSalePaymentStatus(tx: DbOrTx, saleId: string): Promise<SalePaymentStatus> {
  const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  if (!sale) throw new Error("Sale not found");
  if (sale.status === "cancelled") return sale.paymentStatus;
  const [{ paid }] = await tx.select({ paid: sql<string>`coalesce(sum(${salePayments.amountCents}), 0)` }).from(salePayments).where(eq(salePayments.saleId, saleId));
  const paidCents = Number(paid);
  const status: SalePaymentStatus = paidCents <= 0 ? "unpaid" : paidCents >= sale.totalCents ? "paid" : "partially_paid";
  await tx.update(sales).set({ paymentStatus: status, updatedAt: new Date() }).where(eq(sales.id, saleId));
  return status;
}

export interface RecordPaymentInput {
  saleId: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  notes?: string | null;
}

/** Split-payment ready (brief §24) — every call just appends a row; a
 * Sale's paymentStatus is always recomputed from the sum, never set by
 * hand, so "$20 PayNow now, $15 Cash later" naturally lands on "Paid" once
 * both rows exist. This is also what a String Job's "Take payment" action
 * calls once it has a linked Sale (src/lib/jobs.ts) — never
 * changePaymentStatus on the job itself once a Sale exists. */
export async function recordSalePayment(input: RecordPaymentInput): Promise<Sale> {
  return db.transaction(async (tx) => {
    await tx.insert(salePayments).values({ saleId: input.saleId, amountCents: input.amountCents, paymentMethod: input.paymentMethod, notes: input.notes?.trim() || null });
    await recalcSalePaymentStatus(tx, input.saleId);
    const [sale] = await tx.select().from(sales).where(eq(sales.id, input.saleId)).limit(1);
    return sale;
  });
}

export async function listPaymentsForSale(saleId: string): Promise<SalePayment[]> {
  return db.select().from(salePayments).where(eq(salePayments.saleId, saleId)).orderBy(desc(salePayments.paymentDate));
}

/** Corrects occurredAt's calendar day only — the time-of-day already on the
 * row (set at checkout, or copied from the job's completedAt for a
 * job-linked sale) is kept as-is, so this can't reorder same-day sales
 * relative to each other just from a date fix. occurredAt is the sole
 * revenue date reports read (see the header comment above) and is
 * deliberately independent of a linked job's own dates, so correcting it
 * here needs no follow-on sync anywhere. */
export async function updateSaleDate(saleId: string, newDate: string): Promise<Sale> {
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  if (!sale) throw new Error("Sale not found");
  const [year, month, day] = newDate.split("-").map(Number);
  const occurredAt = new Date(sale.occurredAt);
  occurredAt.setFullYear(year, month - 1, day);
  const [updated] = await db.update(sales).set({ occurredAt, updatedAt: new Date() }).where(eq(sales.id, saleId)).returning();
  return updated;
}

// -- cancel --------------------------------------------------------------

export type CancelSaleResult = { ok: true; sale: Sale } | { ok: false; reason: "not_found" } | { ok: false; reason: "already_paid" } | { ok: false; reason: "not_completed" };

/** Reverses every item's inventory deduction (restocked) and marks the Sale
 * cancelled — the record itself is never deleted (brief §32). Only allowed
 * while nothing has been paid yet; once a payment exists, use the Return
 * workflow instead so the refund itself stays on the audit trail (brief
 * §30's "do not silently rewrite a transaction that already happened",
 * applied here to cancellation rather than a price edit). */
export async function cancelSale(saleId: string, reason: string): Promise<CancelSaleResult> {
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  if (!sale) return { ok: false, reason: "not_found" };
  if (sale.status !== "completed") return { ok: false, reason: "not_completed" };
  if (sale.paymentStatus !== "unpaid") return { ok: false, reason: "already_paid" };

  const updated = await db.transaction(async (tx) => {
    const items = await tx.select().from(saleItems).where(eq(saleItems.saleId, saleId));
    for (const item of items) {
      const outstanding = Number(item.quantity) - Number(item.returnedQuantity);
      if (outstanding <= 0) continue;
      if (item.itemType === "product") {
        await reverseAllocationsForSaleItem(tx, item.id, outstanding, `Sale ${sale.code} cancelled — ${reason.trim()}`, "reversal");
      } else if (item.itemType === "string_product") {
        await reverseStringSaleItem(tx, item.id, outstanding, `Sale ${sale.code} cancelled — ${reason.trim()}`, true);
      }
    }
    const [row] = await tx.update(sales).set({ status: "cancelled", notes: [sale.notes, `Cancelled: ${reason.trim()}`].filter(Boolean).join(" — "), updatedAt: new Date() }).where(eq(sales.id, saleId)).returning();
    return row;
  });
  return { ok: true, sale: updated };
}

// -- returns ---------------------------------------------------------------

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
  refundCents: number;
  reason: string;
  restock: boolean;
}

export type ReturnItemResult = { ok: true; reversingSale: Sale } | { ok: false; reason: "not_found" } | { ok: false; reason: "over_quantity" };

/** A return never edits the original Sale/Sale Item snapshot (brief §33) —
 * it posts a reversing Sale (negative revenue, negative COGS) linked via
 * reversesSaleId, exactly the mechanism docs/architecture.html §02 already
 * settled on for returns in general. The original sale_item's
 * returnedQuantity is incremented (never its lineTotalCents/cogsAmountCents
 * themselves) so "net" figures can be derived at read time while the
 * as-sold snapshot stays intact. restock=false (a damaged/non-resellable
 * return) still posts the revenue reversal but skips crediting stock back
 * (brief §35). */
export async function returnSaleItem(input: ReturnItemInput): Promise<ReturnItemResult> {
  const [item] = await db.select().from(saleItems).where(eq(saleItems.id, input.saleItemId)).limit(1);
  if (!item) return { ok: false, reason: "not_found" };
  const outstanding = Number(item.quantity) - Number(item.returnedQuantity);
  if (input.quantity <= 0 || input.quantity > outstanding + 0.0001) return { ok: false, reason: "over_quantity" };

  const [original] = await db.select().from(sales).where(eq(sales.id, item.saleId)).limit(1);
  if (!original) return { ok: false, reason: "not_found" };

  const reversingSale = await db.transaction(async (tx) => {
    let cogsReversedCents = 0;
    if (item.itemType === "product") {
      cogsReversedCents = await reverseAllocationsForSaleItem(tx, item.id, input.quantity, `Return — ${input.reason.trim()}`, input.restock ? "return" : "return_no_restock");
    } else if (item.itemType === "string_product") {
      cogsReversedCents = await reverseStringSaleItem(tx, item.id, input.quantity, `Return — ${input.reason.trim()}`, input.restock);
    } else {
      // custom/string_job_service lines carry no inventory allocation —
      // reverse COGS proportionally to the quantity returned, same
      // arithmetic as products.ts's reversal, just without a batch to touch.
      cogsReversedCents = Math.round((item.cogsAmountCents * input.quantity) / Number(item.quantity));
    }

    const newReturnedQuantity = (Number(item.returnedQuantity) + input.quantity).toFixed(2);
    await tx.update(saleItems).set({ returnedQuantity: newReturnedQuantity }).where(eq(saleItems.id, item.id));

    const [reversing] = await tx
      .insert(sales)
      .values({
        customerId: original.customerId,
        occurredAt: new Date(),
        status: "completed",
        subtotalCents: -input.refundCents,
        discountCents: 0,
        totalCents: -input.refundCents,
        paymentStatus: "refunded",
        reversesSaleId: original.id,
        notes: `Return against ${original.code}${input.restock ? "" : " (not restocked)"} — ${input.reason.trim()}`,
      })
      .returning();

    await tx.insert(saleItems).values({
      saleId: reversing.id,
      itemType: item.itemType,
      productId: item.productId,
      stringProductId: item.stringProductId,
      descriptionSnapshot: `Return: ${item.descriptionSnapshot}`,
      skuSnapshot: item.skuSnapshot,
      quantity: (-input.quantity).toFixed(2),
      standardPriceCentsSnapshot: item.standardPriceCentsSnapshot,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: -input.refundCents,
      cogsAmountCents: -cogsReversedCents,
      grossProfitCents: -input.refundCents + cogsReversedCents,
    });

    // Roll the original Sale's own status forward to reflect the return —
    // never its totals/line items themselves (those stay exactly as sold).
    const allItems = await tx.select().from(saleItems).where(eq(saleItems.saleId, original.id));
    const fullyReturned = allItems.every((i) => Number(i.returnedQuantity) + (i.id === item.id ? input.quantity : 0) >= Number(i.quantity) - 0.0001);
    await tx
      .update(sales)
      .set({ status: fullyReturned ? "refunded" : "partially_refunded", updatedAt: new Date() })
      .where(eq(sales.id, original.id));

    return reversing;
  });

  return { ok: true, reversingSale };
}

// -- string job integration ---------------------------------------------

export interface JobServiceLine {
  serviceName: string;
  quantity: string;
  unitPriceCents: number;
  totalCents: number;
}

export interface CreateJobSaleInput {
  stringJobId: string;
  customerId: string;
  services: JobServiceLine[];
  discountCents: number;
  stringCogsCents: number;
  /** The job's own paymentStatus/paymentMethod from before it had a linked
   * Sale (Phase 4's direct fields, settable any time pre-completion — see
   * changePaymentStatus's guard in jobs.ts). Without this, a job marked
   * "Paid" while still in progress silently reverted to "unpaid" the
   * moment it was completed: the freshly-created Sale below has no
   * knowledge of that status and always started unpaid, discarding a
   * customer's already-recorded payment. When the job was marked "paid",
   * this records one real sale_payments row for the full total (method
   * falls back to "other" if the job never had one set) so the new Sale
   * reflects it immediately. "partially_paid" can't be carried over the
   * same way — Phase 4 never stored a paid amount, only the status, so
   * there's no real figure to record — it's left unpaid, same as before. */
  carryOverPaidMethod?: PaymentMethod | null;
}

/** Creates the ONE linked Sale for a String Job the first time it reaches
 * "completed" (brief §25/§27) — called from changeJobStatus
 * (src/lib/jobs.ts) inside the same transaction/idempotency guard that
 * already protects the string inventory deduction, so this runs at most
 * once per job no matter how many times "mark completed" is clicked. Each
 * of the job's string_job_services lines becomes one Sale Item
 * (itemType='string_job_service'); the line named "String cost" (the
 * convention job-form-types.ts suggests) gets stringCogsCents as its COGS
 * — everything else (labour, a typed "Grip replacement" line, ...) is 0
 * COGS for now (brief §28), pending a future phase's labour costing. The
 * job's own discountCents maps straight onto the Sale as a fixed discount. */
export async function createJobSale(tx: DbOrTx, input: CreateJobSaleInput): Promise<Sale> {
  const subtotalCents = input.services.reduce((sum, s) => sum + s.totalCents, 0);
  const discountCents = Math.max(0, Math.min(input.discountCents, subtotalCents));
  const totalCents = subtotalCents - discountCents;
  const carryOverPaid = input.carryOverPaidMethod !== undefined && totalCents > 0;

  const [sale] = await tx
    .insert(sales)
    .values({
      customerId: input.customerId,
      stringJobId: input.stringJobId,
      occurredAt: new Date(),
      status: "completed",
      subtotalCents,
      discountType: discountCents > 0 ? "fixed" : null,
      discountValue: discountCents > 0 ? (discountCents / 100).toFixed(2) : null,
      discountCents,
      totalCents,
      paymentStatus: carryOverPaid ? "paid" : "unpaid",
    })
    .returning();

  await insertJobServiceLines(tx, sale.id, input.services, input.stringCogsCents);
  if (carryOverPaid) {
    await tx.insert(salePayments).values({
      saleId: sale.id,
      amountCents: totalCents,
      paymentMethod: input.carryOverPaidMethod || "other",
      notes: "Carried over from this job's payment status before completion.",
    });
  }
  await tx.update(stringJobs).set({ saleId: sale.id }).where(eq(stringJobs.id, input.stringJobId));
  return sale;
}

async function insertJobServiceLines(tx: DbOrTx, saleId: string, services: JobServiceLine[], stringCogsCents: number): Promise<void> {
  let stringCogsAssigned = false;
  for (const s of services) {
    const isStringLine = !stringCogsAssigned && s.serviceName.trim().toLowerCase() === "string cost";
    const cogsAmountCents = isStringLine ? stringCogsCents : 0;
    if (isStringLine) stringCogsAssigned = true;
    await tx.insert(saleItems).values({
      saleId,
      itemType: "string_job_service",
      descriptionSnapshot: s.serviceName,
      quantity: s.quantity,
      standardPriceCentsSnapshot: s.unitPriceCents,
      unitPriceCents: s.unitPriceCents,
      lineTotalCents: s.totalCents,
      cogsAmountCents,
      grossProfitCents: s.totalCents - cogsAmountCents,
    });
  }
}

/** Thrown by resyncJobSale (and caught by updateJob, src/lib/jobs.ts) when
 * the job's linked Sale already has a payment on it — a paid Sale is a
 * financial transaction that already happened and is never silently
 * rewritten (brief §30). Thrown rather than returned as a result so
 * updateJob's whole transaction rolls back atomically: either the job edit
 * and the Sale resync both land, or neither does. */
export class SaleLockedError extends Error {
  constructor(public saleCode: string) {
    super(`Sale ${saleCode} already has a payment recorded and can't be silently resynced`);
  }
}

/** Called from updateJob (src/lib/jobs.ts), inside its own transaction,
 * whenever a job that already has a linked Sale is edited — keeps the
 * Sale's string_job_service lines in sync with the job's current
 * services/discount/string COGS (brief §30). Only touches those lines; a
 * retail product separately attached via addProductToJobSale below is left
 * alone. The row lock (`for("update")`) closes the gap between checking
 * paymentStatus and acting on it — a payment recorded by a concurrent
 * request can't sneak in between the check and the resync. */
export async function resyncJobSale(tx: DbOrTx, saleId: string, services: JobServiceLine[], discountCents: number, stringCogsCents: number): Promise<void> {
  const [sale] = await tx.select().from(sales).where(eq(sales.id, saleId)).for("update");
  if (!sale) return; // sale was deleted somehow — nothing to sync, don't block the job edit
  if (sale.paymentStatus !== "unpaid") throw new SaleLockedError(sale.code);

  const productLines = await tx.select().from(saleItems).where(and(eq(saleItems.saleId, saleId), eq(saleItems.itemType, "product")));
  const productTotalCents = productLines.reduce((sum, l) => sum + l.lineTotalCents, 0);

  await tx.delete(saleItems).where(and(eq(saleItems.saleId, saleId), eq(saleItems.itemType, "string_job_service")));
  await insertJobServiceLines(tx, saleId, services, stringCogsCents);

  const serviceSubtotalCents = services.reduce((sum, s) => sum + s.totalCents, 0);
  const subtotalCents = serviceSubtotalCents + productTotalCents;
  const resolvedDiscountCents = Math.max(0, Math.min(discountCents, subtotalCents));
  const totalCents = subtotalCents - resolvedDiscountCents;

  await tx
    .update(sales)
    .set({
      subtotalCents,
      discountType: resolvedDiscountCents > 0 ? "fixed" : null,
      discountValue: resolvedDiscountCents > 0 ? (resolvedDiscountCents / 100).toFixed(2) : null,
      discountCents: resolvedDiscountCents,
      totalCents,
      updatedAt: new Date(),
    })
    .where(eq(sales.id, saleId));
  await recalcSalePaymentStatus(tx, saleId);
}

export type AddProductToJobSaleResult = { ok: true; sale: Sale } | { ok: false; reason: "sale_locked"; saleCode: string } | { ok: false; reason: "insufficient_stock"; available: number };

/** Lets a String Job's linked Sale pick up a retail product bought at the
 * same visit (brief §29 — "buys 1 overgrip while collecting the racket")
 * without opening a second POS sale. Blocked the same way resyncJobSale is
 * once the linked Sale has a payment on it. */
export async function addProductToJobSale(saleId: string, productId: string, quantity: number, allowStockOverride = false): Promise<AddProductToJobSaleResult> {
  const [sale] = await db.select().from(sales).where(eq(sales.id, saleId)).limit(1);
  if (!sale) throw new Error("Sale not found");
  if (sale.paymentStatus !== "unpaid") return { ok: false, reason: "sale_locked", saleCode: sale.code };

  if (!allowStockOverride) {
    const product = await getProduct(productId);
    if (product?.trackInventory) {
      const { sufficient, available } = await previewProductStock(productId, quantity);
      if (!sufficient) return { ok: false, reason: "insufficient_stock", available };
    }
  }

  const updated = await db.transaction(async (tx) => {
    const product = await getProduct(productId);
    if (!product) throw new Error("Product not found");
    const unitPriceCents = product.defaultSellingPriceCents ?? 0;
    const lineTotalCents = Math.round(unitPriceCents * quantity);

    const [item] = await tx
      .insert(saleItems)
      .values({
        saleId,
        itemType: "product",
        productId: product.id,
        descriptionSnapshot: [product.brand, product.name, product.variant].filter(Boolean).join(" "),
        skuSnapshot: product.sku,
        quantity: String(quantity),
        standardPriceCentsSnapshot: unitPriceCents,
        unitPriceCents,
        lineTotalCents,
        grossProfitCents: lineTotalCents,
      })
      .returning();

    let cogsCents = 0;
    if (product.trackInventory) {
      const result = await allocateProductForSaleItem({ tx, productId, saleItemId: item.id, quantityNeeded: quantity, allowOverride: allowStockOverride, saleId });
      cogsCents = result.cogsCents;
    } else {
      cogsCents = Math.round((product.costPriceCents ?? 0) * quantity);
    }
    await tx.update(saleItems).set({ cogsAmountCents: cogsCents, grossProfitCents: lineTotalCents - cogsCents }).where(eq(saleItems.id, item.id));

    const subtotalCents = sale.subtotalCents + lineTotalCents;
    const totalCents = sale.totalCents + lineTotalCents;
    const [row] = await tx.update(sales).set({ subtotalCents, totalCents, updatedAt: new Date() }).where(eq(sales.id, saleId)).returning();
    return row;
  });
  return { ok: true, sale: updated };
}

// -- reads -----------------------------------------------------------------

export interface SaleListRow {
  id: string;
  code: string;
  occurredAt: Date;
  customerId: string | null;
  customerName: string | null;
  stringJobId: string | null;
  stringJobCode: string | null;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  itemCount: number;
  itemSummary: string;
  totalCents: number;
}

/** Shared by every sales-list query below — attaches each row's item
 * descriptions (for itemSummary) via one batched lookup rather than N+1
 * queries, same pattern the old unbounded listSales() used. */
async function attachItemSummaries(rows: { sale: typeof sales.$inferSelect; customerName: string | null; stringJobCode: string | null }[]): Promise<SaleListRow[]> {
  if (rows.length === 0) return [];
  const items = await db
    .select({ saleId: saleItems.saleId, description: saleItems.descriptionSnapshot })
    .from(saleItems)
    .where(inArray(saleItems.saleId, rows.map((r) => r.sale.id)));
  const itemsBySale = new Map<string, string[]>();
  for (const it of items) {
    const arr = itemsBySale.get(it.saleId) ?? [];
    arr.push(it.description);
    itemsBySale.set(it.saleId, arr);
  }
  return rows.map((r) => {
    const descs = itemsBySale.get(r.sale.id) ?? [];
    return {
      id: r.sale.id,
      code: r.sale.code,
      occurredAt: r.sale.occurredAt,
      customerId: r.sale.customerId,
      customerName: r.customerName,
      stringJobId: r.sale.stringJobId,
      stringJobCode: r.stringJobCode,
      status: r.sale.status,
      paymentStatus: r.sale.paymentStatus,
      itemCount: descs.length,
      itemSummary: descs.length > 2 ? `${descs.slice(0, 2).join(", ")} +${descs.length - 2} more` : descs.join(", "),
      totalCents: r.sale.totalCents,
    };
  });
}

export interface SalesFilters {
  /** Inclusive lower bound on occurredAt. Null/undefined = no lower bound. */
  dateFrom?: Date | null;
  /** Exclusive upper bound on occurredAt. Null/undefined = no upper bound. */
  dateTo?: Date | null;
  search?: string | null;
  paymentStatus?: SalePaymentStatus | null;
  status?: SaleStatus | null;
}

/** Every historical Sale is a permanent record (brief: never delete/archive
 * on month-end) — filtering narrows what's *displayed*, it never narrows
 * what's searchable. A blank date filter (All time) plus a matching code/
 * customer/job/item search finds a Sale from any point in history. */
function baseSalesConditions(filters: SalesFilters) {
  const conditions = [];
  if (filters.dateFrom) conditions.push(gte(sales.occurredAt, filters.dateFrom));
  if (filters.dateTo) conditions.push(lt(sales.occurredAt, filters.dateTo));
  if (filters.paymentStatus) conditions.push(eq(sales.paymentStatus, filters.paymentStatus));
  if (filters.status) conditions.push(eq(sales.status, filters.status));
  const q = filters.search?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(sql`(
      ${sales.code} ilike ${like}
      or exists (select 1 from ${customers} c where c.id = ${sales.customerId} and c.name ilike ${like})
      or exists (select 1 from ${stringJobs} j where j.id = ${sales.stringJobId} and j.code ilike ${like})
      or exists (select 1 from ${saleItems} si where si.sale_id = ${sales.id} and si.description_snapshot ilike ${like})
    )`);
  }
  return conditions;
}

export interface SalesPageParams extends SalesFilters {
  /** 1-indexed. */
  page: number;
  pageSize: number;
}

export interface SalesPageResult {
  rows: SaleListRow[];
  totalCount: number;
}

/** The Sales list's data source — filters and pages entirely in the
 * database (brief: never fetch everything and filter in the browser).
 * Newest first, with a stable secondary sort so pagination never skips or
 * repeats a row when two Sales share a timestamp. */
export async function listSalesPage(params: SalesPageParams): Promise<SalesPageResult> {
  const conditions = baseSalesConditions(params);
  const where = conditions.length ? and(...conditions) : sql`true`;

  const [countRow] = await db.select({ count: sql<string>`count(*)` }).from(sales).where(where);
  const totalCount = Number(countRow?.count ?? 0);

  const rows = await db
    .select({ sale: sales, customerName: customers.name, stringJobCode: stringJobs.code })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .leftJoin(stringJobs, eq(stringJobs.id, sales.stringJobId))
    .where(where)
    .orderBy(desc(sales.occurredAt), desc(sales.code))
    .limit(params.pageSize)
    .offset((params.page - 1) * params.pageSize);

  return { rows: await attachItemSummaries(rows), totalCount };
}

export interface SalesSummary {
  /** Primary transactions only (a return isn't its own "sale" — it's a
   * reversal of one already counted) that occurred, weren't cancelled. */
  saleCount: number;
  /** Sum of totalCents across primary sales AND their reversing entries —
   * a return's negative totalCents nets straight out of this, so it's
   * already "net", never gross transaction volume (brief requirement). */
  netRevenueCents: number;
  /** Same netting logic, summed from sale_items.cogsAmountCents (a
   * reversal's line items carry negative COGS proportional to what was
   * returned — see returnSaleItem). */
  cogsCents: number;
  /** netRevenueCents - cogsCents, derived rather than summed separately so
   * it can never drift out of sync with the two numbers it's built from. */
  grossProfitCents: number;
  /** Outstanding balance (totalCents, net of any returns against it, minus
   * paid) across primary sales that aren't fully paid. Reversing entries
   * are excluded as their OWN row — a refund is already a settled
   * transaction, never itself "unpaid" — but a return's amount still
   * reduces what its original sale is outstanding for (see getSale's
   * netTotalCents for the same netting on a single sale). */
  unpaidCents: number;
  /** Cash actually collected (sum of sale_payments.amountCents) across
   * primary sales in range — distinct from netRevenueCents, which is
   * accrual-based and counts a Sale as revenue the moment it's recognised,
   * paid or not (Phase 7 brief §23: never conflate Revenue with Payments
   * Received/Cash Flow). */
  paymentsReceivedCents: number;
}

/** Cancelled Sales never count toward any of these — a cancellation means
 * the transaction never actually happened, so its totalCents was never
 * real revenue, regardless of which status filter is currently applied to
 * the list (viewing only Cancelled sales correctly shows $0 here). */
export async function getSalesSummary(filters: SalesFilters): Promise<SalesSummary> {
  const conditions = [sql`${sales.status} != 'cancelled'`, ...baseSalesConditions(filters)];
  const where = and(...conditions);
  const primaryWhere = and(...conditions, isNull(sales.reversesSaleId));

  const [[revenueRow], [countRow], [cogsRow], unpaidRows] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${sales.totalCents}), 0)` }).from(sales).where(where),
    db.select({ count: sql<string>`count(*)` }).from(sales).where(primaryWhere),
    db.select({ cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)` }).from(saleItems).innerJoin(sales, eq(sales.id, saleItems.saleId)).where(where),
    db
      .select({ id: sales.id, totalCents: sales.totalCents, paidCents: sql<string>`coalesce(sum(${salePayments.amountCents}), 0)` })
      .from(sales)
      .leftJoin(salePayments, eq(salePayments.saleId, sales.id))
      .where(primaryWhere)
      .groupBy(sales.id, sales.totalCents),
  ]);

  // A return posts as its own reversing Sale (negative totalCents) rather
  // than editing the original — looked up separately (not date-filtered:
  // "is this sale still outstanding right now" needs every return against
  // it, whenever it happened) and merged in JS rather than joined
  // alongside salePayments above, which would fan out and double-count.
  const primarySaleIds = unpaidRows.map((r) => r.id);
  const reversalRows = primarySaleIds.length
    ? await db
        .select({ reversesSaleId: sales.reversesSaleId, reversedCents: sql<string>`coalesce(sum(${sales.totalCents}), 0)` })
        .from(sales)
        .where(and(sql`${sales.status} != 'cancelled'`, inArray(sales.reversesSaleId, primarySaleIds)))
        .groupBy(sales.reversesSaleId)
    : [];
  const reversedMap = new Map(reversalRows.map((r) => [r.reversesSaleId, Number(r.reversedCents)]));

  const netRevenueCents = Number(revenueRow?.total ?? 0);
  const cogsCents = Number(cogsRow?.cogs ?? 0);
  return {
    saleCount: Number(countRow?.count ?? 0),
    netRevenueCents,
    cogsCents,
    grossProfitCents: netRevenueCents - cogsCents,
    unpaidCents: unpaidRows.reduce((sum, r) => {
      const netTotalCents = r.totalCents + (reversedMap.get(r.id) ?? 0);
      return sum + Math.max(0, netTotalCents - Number(r.paidCents));
    }, 0),
    paymentsReceivedCents: unpaidRows.reduce((sum, r) => sum + Number(r.paidCents), 0),
  };
}

export interface SaleDetail extends Sale {
  customer: typeof customers.$inferSelect | null;
  stringJobCode: string | null;
  items: SaleItem[];
  payments: SalePayment[];
  subtotalRevenueCents: number;
  cogsCents: number;
  grossProfitCents: number;
  paidCents: number;
  /** Total refunded against this sale — the sum of every reversing Sale's
   * totalCents linked to it via reversesSaleId, as a positive number. A
   * return never edits this sale's own totalCents (the snapshot rule), so
   * this is how "how much has actually been returned" stays visible
   * without digging through separate reversal rows. */
  returnedCents: number;
  /** totalCents - returnedCents — what this sale is really worth after
   * returns, the figure balanceDueCents is computed against. */
  netTotalCents: number;
  balanceDueCents: number;
}

export async function getSale(id: string): Promise<SaleDetail | null> {
  const [sale] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  if (!sale) return null;
  const [[customer], items, payments, [jobRow], reversals] = await Promise.all([
    sale.customerId ? db.select().from(customers).where(eq(customers.id, sale.customerId)).limit(1) : Promise.resolve([null]),
    db.select().from(saleItems).where(eq(saleItems.saleId, id)).orderBy(saleItems.createdAt),
    listPaymentsForSale(id),
    sale.stringJobId ? db.select({ code: stringJobs.code }).from(stringJobs).where(eq(stringJobs.id, sale.stringJobId)).limit(1) : Promise.resolve([null]),
    db.select({ totalCents: sales.totalCents }).from(sales).where(eq(sales.reversesSaleId, id)),
  ]);
  const cogsCents = items.reduce((sum, i) => sum + i.cogsAmountCents, 0);
  const paidCents = payments.reduce((sum, p) => sum + p.amountCents, 0);
  // Reversing sales carry a negative totalCents (see returnSaleItem) — sum
  // as a positive "returned" figure rather than exposing the sign flip.
  const returnedCents = reversals.reduce((sum, r) => sum - r.totalCents, 0);
  const netTotalCents = sale.totalCents - returnedCents;
  return {
    ...sale,
    customer: customer ?? null,
    stringJobCode: jobRow?.code ?? null,
    items,
    payments,
    subtotalRevenueCents: sale.totalCents,
    cogsCents,
    grossProfitCents: sale.totalCents - cogsCents,
    paidCents,
    returnedCents,
    netTotalCents,
    balanceDueCents: Math.max(0, netTotalCents - paidCents),
  };
}

export interface SaleMovementRow {
  id: string;
  occurredAt: Date;
  kind: "product" | "string_product";
  label: string;
  movementType: string;
  quantityChange: string;
  unit: string;
}

/** Sale Detail's "Inventory Movements" section (brief §37) — everything
 * either ledger recorded against this Sale, merged into one
 * chronological list. */
export async function listMovementsForSale(saleId: string): Promise<SaleMovementRow[]> {
  const [productRows, stringRows] = await Promise.all([
    db
      .select({ movement: productInventoryMovements, name: products.name, brand: products.brand, variant: products.variant })
      .from(productInventoryMovements)
      .innerJoin(products, eq(products.id, productInventoryMovements.productId))
      .where(eq(productInventoryMovements.saleId, saleId)),
    db
      .select({ movement: stringInventoryMovements, brand: stringProducts.brand, name: stringProducts.name, gauge: stringProducts.gauge, colour: stringProducts.colour })
      .from(stringInventoryMovements)
      .innerJoin(stringProducts, eq(stringProducts.id, stringInventoryMovements.stringProductId))
      .where(eq(stringInventoryMovements.saleId, saleId)),
  ]);
  const rows: SaleMovementRow[] = [
    ...productRows.map((r) => ({
      id: r.movement.id,
      occurredAt: r.movement.occurredAt,
      kind: "product" as const,
      label: [r.brand, r.name, r.variant].filter(Boolean).join(" "),
      movementType: r.movement.movementType,
      quantityChange: String(r.movement.quantityChange),
      unit: "unit",
    })),
    ...stringRows.map((r) => ({
      id: r.movement.id,
      occurredAt: r.movement.occurredAt,
      kind: "string_product" as const,
      label: [r.brand, r.name, r.gauge ? `${r.gauge}mm` : null, r.colour].filter(Boolean).join(" "),
      movementType: r.movement.movementType,
      quantityChange: r.movement.quantityChange,
      unit: r.movement.unit,
    })),
  ];
  return rows.sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt));
}

export interface CustomerPurchaseRow {
  id: string;
  code: string;
  occurredAt: Date;
  itemSummary: string;
  totalCents: number;
  paymentStatus: SalePaymentStatus;
  status: SaleStatus;
}

/** Powers the customer profile's Purchase history tab — every Sale linked
 * to this customer, including string-job sales (kept separate from
 * Stringing history on the same profile, which stays the operational
 * view — brief §39). Unbounded and undated on purpose: a customer's
 * history stays visible in full regardless of how old it is (the Sales
 * list's date filter/pagination is a display concern for that page only,
 * never a reason a Sale becomes unreachable elsewhere). */
export async function listSalesForCustomer(customerId: string): Promise<CustomerPurchaseRow[]> {
  const rows = await db
    .select({ sale: sales, customerName: customers.name, stringJobCode: stringJobs.code })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .leftJoin(stringJobs, eq(stringJobs.id, sales.stringJobId))
    .where(eq(sales.customerId, customerId))
    .orderBy(desc(sales.occurredAt), desc(sales.code));
  const withItems = await attachItemSummaries(rows);
  return withItems.map((r) => ({ id: r.id, code: r.code, occurredAt: r.occurredAt, itemSummary: r.itemSummary, totalCents: r.totalCents, paymentStatus: r.paymentStatus, status: r.status }));
}

export interface ProductSaleRow {
  saleId: string;
  saleItemId: string;
  saleCode: string;
  occurredAt: Date;
  quantity: string;
  lineTotalCents: number;
}

/** Powers a Product's own detail page "Sales history" section (brief §12). */
export async function listSalesForProduct(productId: string): Promise<ProductSaleRow[]> {
  const rows = await db
    .select({ item: saleItems, saleCode: sales.code, occurredAt: sales.occurredAt })
    .from(saleItems)
    .innerJoin(sales, eq(sales.id, saleItems.saleId))
    .where(eq(saleItems.productId, productId))
    .orderBy(desc(sales.occurredAt));
  return rows.map((r) => ({ saleId: r.item.saleId, saleItemId: r.item.id, saleCode: r.saleCode, occurredAt: r.occurredAt, quantity: r.item.quantity, lineTotalCents: r.item.lineTotalCents }));
}

export interface DashboardSalesStats {
  todayRevenueCents: number;
  monthRevenueCents: number;
  unpaidSalesCount: number;
  unpaidSalesCents: number;
  monthGrossProfitCents: number;
}

/** Dashboard's Phase 6 numbers (brief §44) — Sales only, per the
 * single-source-of-truth rule at the top of this file. */
export async function getDashboardSalesStats(): Promise<DashboardSalesStats> {
  const [[today], [month], unpaidRows, [monthItems]] = await Promise.all([
    db.select({ total: sql<string>`coalesce(sum(${sales.totalCents}), 0)` }).from(sales).where(and(gte(sales.occurredAt, sql`date_trunc('day', now())`), sql`${sales.status} != 'cancelled'`)),
    db.select({ total: sql<string>`coalesce(sum(${sales.totalCents}), 0)` }).from(sales).where(and(gte(sales.occurredAt, sql`date_trunc('month', now())`), sql`${sales.status} != 'cancelled'`)),
    // A LEFT JOIN + GROUP BY rather than a correlated subquery in the
    // SELECT list — straightforward to get right, no risk of the subquery
    // silently losing its correlation to the outer sales row.
    db
      .select({ id: sales.id, totalCents: sales.totalCents, paidCents: sql<string>`coalesce(sum(${salePayments.amountCents}), 0)` })
      .from(sales)
      .leftJoin(salePayments, eq(salePayments.saleId, sales.id))
      // Not just status='completed' — a partial return moves the ORIGINAL
      // sale's own status to 'partially_refunded' (see returnSaleItem), and
      // that sale can still have a real balance due on what wasn't
      // returned. Excluding it here made it vanish from this stat entirely
      // the moment any return touched it, instead of showing its correctly
      // reduced balance — 'cancelled' is the only status that means
      // nothing is actually owed, matching getSalesSummary's own filter.
      .where(and(inArray(sales.paymentStatus, ["unpaid", "partially_paid"]), sql`${sales.status} != 'cancelled'`))
      .groupBy(sales.id, sales.totalCents),
    // Independent of the three above (own join, own date filter) — ran as
    // a separate sequential await before, adding its full round-trip time
    // on top of the Promise.all instead of overlapping with it.
    db
      .select({ cogs: sql<string>`coalesce(sum(${saleItems.cogsAmountCents}), 0)` })
      .from(saleItems)
      .innerJoin(sales, eq(sales.id, saleItems.saleId))
      .where(and(gte(sales.occurredAt, sql`date_trunc('month', now())`), sql`${sales.status} != 'cancelled'`)),
  ]);
  const monthRevenueCents = Number(month?.total ?? 0);
  const monthCogsCents = Number(monthItems?.cogs ?? 0);

  // Same return-netting as getSalesSummary — a partial return against an
  // unpaid sale reduces what it's actually outstanding for.
  const unpaidSaleIds = unpaidRows.map((r) => r.id);
  const reversalRows = unpaidSaleIds.length
    ? await db
        .select({ reversesSaleId: sales.reversesSaleId, reversedCents: sql<string>`coalesce(sum(${sales.totalCents}), 0)` })
        .from(sales)
        .where(and(sql`${sales.status} != 'cancelled'`, inArray(sales.reversesSaleId, unpaidSaleIds)))
        .groupBy(sales.reversesSaleId)
    : [];
  const reversedMap = new Map(reversalRows.map((r) => [r.reversesSaleId, Number(r.reversedCents)]));

  return {
    todayRevenueCents: Number(today?.total ?? 0),
    monthRevenueCents,
    unpaidSalesCount: unpaidRows.length,
    unpaidSalesCents: unpaidRows.reduce((sum, r) => sum + Math.max(0, r.totalCents + (reversedMap.get(r.id) ?? 0) - Number(r.paidCents)), 0),
    monthGrossProfitCents: monthRevenueCents - monthCogsCents,
  };
}

export interface RecentSaleRow {
  id: string;
  code: string;
  occurredAt: Date;
  customerName: string | null;
  itemSummary: string;
  totalCents: number;
  paymentStatus: SalePaymentStatus;
}

export async function listRecentSales(limit = 8): Promise<RecentSaleRow[]> {
  const { rows } = await listSalesPage({ page: 1, pageSize: limit });
  return rows.map((r) => ({ id: r.id, code: r.code, occurredAt: r.occurredAt, customerName: r.customerName, itemSummary: r.itemSummary, totalCents: r.totalCents, paymentStatus: r.paymentStatus }));
}

// -- picker helper -----------------------------------------------------------

export interface PickerCustomer {
  id: string;
  code: string;
  name: string;
  phone: string;
}

export async function searchCustomersForPicker(query: string): Promise<PickerCustomer[]> {
  const like = `%${query.trim()}%`;
  const rows = await db
    .select({ id: customers.id, code: customers.code, name: customers.name, phone: customers.phone })
    .from(customers)
    .where(and(isNull(customers.archivedAt), sql`(${customers.name} ilike ${like} or ${customers.phone} ilike ${like} or ${customers.code} ilike ${like})`))
    .orderBy(customers.name)
    .limit(20);
  return rows;
}
