// SportCraft — Drizzle schema, matching the design in docs/architecture.html
// (sections 03–06: database schema, relationships, the no-double-counting revenue
// rule, and batch-level FIFO reel costing). Live against Supabase Postgres via
// src/db/client.ts since Phase 2.
//
// Conventions: money is integer cents, lengths are numeric(10,2) metres, every
// timestamp is timestamptz. Every customer/job/sale-facing row gets a short code
// (`C0001`, `J0001`, `S0001`) alongside its uuid primary key. Columns comprising
// the "snapshot rule" (never recomputed after the transaction) are marked below.

import { boolean, date, integer, jsonb, numeric, pgEnum, pgSequence, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () => uuid("id").defaultRandom().primaryKey();
const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() };

// Shared by string_inventory_batches (Phase 5) and product_inventory_batches
// (Phase 6) — the same batch lifecycle applies to both kinds of stock.
export const inventoryBatchStatusEnum = pgEnum("inventory_batch_status", ["active", "depleted", "archived"]);

// Human-readable IDs (C0001, R0001, J0001, ...). A DB sequence keeps
// generation atomic under concurrent inserts and monotonic even as rows are
// archived/cancelled (never reused, never re-derived from a row count).
export const customerCodeSeq = pgSequence("customer_code_seq", { startWith: 1, minValue: 1 });
export const racketCodeSeq = pgSequence("racket_code_seq", { startWith: 1, minValue: 1 });
export const jobCodeSeq = pgSequence("job_code_seq", { startWith: 1, minValue: 1 });
export const batchCodeSeq = pgSequence("batch_code_seq", { startWith: 1, minValue: 1 });
// Phase 6
export const productCodeSeq = pgSequence("product_code_seq", { startWith: 1, minValue: 1 });
export const productBatchCodeSeq = pgSequence("product_batch_code_seq", { startWith: 1, minValue: 1 });
export const saleCodeSeq = pgSequence("sale_code_seq", { startWith: 1, minValue: 1 });

// -- people and their frames -------------------------------------------------

export const customers = pgTable("customers", {
  id: id(),
  code: text("code")
    .notNull()
    .unique()
    .default(sql`'C' || lpad(nextval('customer_code_seq')::text, 4, '0')`), // C0001
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  notes: text("notes"),
  ...timestamps,
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const racketBrands = pgTable("racket_brands", {
  id: id(),
  name: text("name").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const racketSeries = pgTable("racket_series", {
  id: id(),
  brandId: uuid("brand_id").notNull().references(() => racketBrands.id),
  name: text("name").notNull(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// A row is a specific model + generation (e.g. "EZONE 100" 2022 and "EZONE
// 100" 2025 are two rows sharing series_id + model). Phase 3.
export const racketModels = pgTable("racket_models", {
  id: id(),
  seriesId: uuid("series_id").notNull().references(() => racketSeries.id),
  model: text("model").notNull(),
  // Brands describe generations differently — a year, a name, or both.
  generationYear: integer("generation_year"),
  generationName: text("generation_name"), // "8th Gen", "V9"
  headSizeSqin: numeric("head_size_sqin", { precision: 6, scale: 2 }),
  // Structured (not "16x19" as one string) so it's usable later for
  // stringing calculations/analytics, not just display.
  stringPatternMains: integer("string_pattern_mains"),
  stringPatternCrosses: integer("string_pattern_crosses"),
  unstrungWeightG: integer("unstrung_weight_g"),
  standardBalanceMm: integer("standard_balance_mm"),
  standardLengthIn: numeric("standard_length_in", { precision: 4, scale: 2 }),
  recommendedTensionMinLbs: numeric("recommended_tension_min_lbs", { precision: 5, scale: 2 }),
  recommendedTensionMaxLbs: numeric("recommended_tension_max_lbs", { precision: 5, scale: 2 }),
  // Phase 5 addition — this specific racket's own recommended string usage,
  // all optional (brief: "do not require this for every racket"). Takes
  // priority over the string-pattern default below when set; a racket that
  // needs noticeably more/less than its pattern's typical amount (frame
  // size, grommet friction, ...) can say so without that becoming every
  // other racket's default too.
  recommendedFullBedLengthM: numeric("recommended_full_bed_length_m", { precision: 6, scale: 2 }),
  recommendedMainLengthM: numeric("recommended_main_length_m", { precision: 6, scale: 2 }),
  recommendedCrossLengthM: numeric("recommended_cross_length_m", { precision: 6, scale: 2 }),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// Phase 5 addition — string usage defaults keyed by pattern ("16x19",
// "18x20", ...), the middle tier of the suggestion priority (specific
// racket model → pattern default → global default; see
// src/lib/string-usage.ts). `pattern` is matched against
// RacketWithSpecs.effectiveStringPattern (src/lib/rackets.ts), which is
// already normalized the same way whether the racket is catalogue-linked
// or manual, so no separate parsing is needed here.
//
// Deliberately not keyed on stringing method (one-piece/two-piece) yet —
// the brief asks only that this not be designed shut against that later.
// `pattern` carries a plain uniqueness constraint rather than being the
// primary key itself, so widening it to a (pattern, stringing_method)
// composite later is an ordinary migration, not a redesign.
export const stringPatternDefaults = pgTable("string_pattern_defaults", {
  id: id(),
  pattern: text("pattern").notNull().unique(),
  fullBedLengthM: numeric("full_bed_length_m", { precision: 6, scale: 2 }),
  mainLengthM: numeric("main_length_m", { precision: 6, scale: 2 }),
  crossLengthM: numeric("cross_length_m", { precision: 6, scale: 2 }),
  notes: text("notes"),
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Two identical frames owned by the same customer are two rows pointing at the
// same racket_model_id — never merged into one.
//
// Phase 2 shipped before the master racket database (Phase 3) existed, so a
// racket could only be entered manually: brand/series/model/generationYear/
// headSizeSqin/stringPattern free text on the row itself, racketModelId null.
// Phase 3 adds the catalogue (racket_models) and links new rackets via
// racketModelId instead — brand/series/model/etc. resolve from the joined
// model (see src/lib/rackets.ts's "effective specs" resolution) rather than
// these columns once linked. The free-text columns stay for: (a) rackets
// that are genuinely unknown/manual (no catalogue entry chosen), and
// (b) not discarding what Phase 2 users already typed in — an existing
// unlinked racket can have racketModelId backfilled onto it later without
// touching these columns.
//
// stringPattern here is intentionally still free text (unlike
// racket_models' structured mains/crosses) — it's the manual/fallback path,
// not the catalogue, so there's nothing to structure it against.
export const customerRackets = pgTable("customer_rackets", {
  id: id(),
  code: text("code")
    .notNull()
    .unique()
    .default(sql`'R' || lpad(nextval('racket_code_seq')::text, 4, '0')`), // R0001
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  racketModelId: uuid("racket_model_id").references(() => racketModels.id),
  // Manual/fallback entry — used only while racketModelId is null.
  brand: text("brand"),
  series: text("series"),
  model: text("model"),
  generationYear: integer("generation_year"),
  headSizeSqin: numeric("head_size_sqin", { precision: 6, scale: 2 }),
  stringPattern: text("string_pattern"),
  // Distinguishes identical frames at a glance ("Match racket #1").
  nickname: text("nickname"),
  // Actual/measured — always this physical racket's own data, regardless of
  // whether it's linked to a catalogue model. Overriding these never writes
  // back to racket_models.
  gripSize: text("grip_size"),
  staticWeightG: integer("static_weight_g"),
  swingweight: integer("swingweight"),
  balanceMm: integer("balance_mm"),
  customisationNotes: text("customisation_notes"),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// -- catalogue and stock -------------------------------------------------

// Phase 5 added contactInfo/active — a lightweight supplier list (brief
// §34: "not a full supplier management system yet"), shared by the string
// inventory batches below and, later, Phase 6/7's products/expenses.
export const suppliers = pgTable("suppliers", {
  id: id(),
  name: text("name").notNull(),
  contactInfo: text("contact_info"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
});

// -- general retail catalogue (Phase 6) -------------------------------------
//
// Deliberately separate from string_products/string_inventory_batches
// (Phase 5) — a string reel/set stays a string_products row and is sold
// retail by a sale_items row pointing straight at stringProductId, never
// duplicated into this table (brief §8/§9/§10: "do not create another
// unrelated stock count for the same string"). `products` here is only for
// general retail merchandise (balls, grips, paddles, rackets, accessories,
// apparel, ...) — see PRODUCT_VS_STRING_PRODUCT in src/lib/products.ts for
// the fuller writeup.
//
// Variants (brief §4, e.g. "Wilson Pro Overgrip" in White/Black/Pink) are
// modelled as separate `products` rows sharing name+brand and differing in
// `variant` — the same pattern already used for string_products (separate
// rows per gauge/colour) and racket_models (separate rows per generation),
// not a nested product_variants table. Keeps one product = one saleable
// SKU = one inventory count, with no cross-row aggregation needed anywhere
// else in the schema.
export const productCategories = pgTable("product_categories", {
  id: id(),
  name: text("name").notNull().unique(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const products = pgTable("products", {
  id: id(),
  code: text("code")
    .notNull()
    .unique()
    .default(sql`'P' || lpad(nextval('product_code_seq')::text, 4, '0')`), // P0001
  name: text("name").notNull(),
  brand: text("brand"),
  categoryId: uuid("category_id").notNull().references(() => productCategories.id),
  // Free text (brief §4/§58) — a distinct colour/size of the same product is
  // its own row (see the file-level comment above), `variant` just labels
  // which one this row is ("White", "S", ...).
  variant: text("variant"),
  sku: text("sku").unique(),
  barcode: text("barcode").unique(),
  // The catalogue's own default selling price — same role as
  // string_products.defaultSellingPriceCents. Actual per-unit COST always
  // comes from product_inventory_batches (FIFO), never stored here, EXCEPT
  // costPriceCents below for the one case that has no batch to draw from.
  defaultSellingPriceCents: integer("default_selling_price_cents"),
  // Fallback/manual cost — the pre-fill suggestion when receiving this
  // product's first batch, and the actual COGS source for a
  // trackInventory=false product (nothing is ever batched for one, so there
  // is no FIFO cost to draw from).
  costPriceCents: integer("cost_price_cents"),
  // Per-product override; falls back to the global default in `settings`
  // (key "inventory_defaults") when null — same pattern as
  // string_products.lowStockThreshold.
  lowStockThreshold: integer("low_stock_threshold"),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  // false for a product deliberately sold without stock counts (e.g. a
  // one-off/miscellaneous catalogue entry) — never gets batches; selling it
  // never touches inventory and its COGS is costPriceCents flat, not FIFO.
  trackInventory: boolean("track_inventory").notNull().default(true),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Reuses inventoryBatchStatusEnum (shared with string_inventory_batches,
// declared near the top of this file) and the same FIFO-batch-costing shape.
// Quantities are integer, not numeric(10,2): retail products are always
// whole units (a can, a pack, a paddle), unlike string reels which need
// fractional metres.
export const productInventoryBatches = pgTable("product_inventory_batches", {
  id: id(),
  batchNumber: text("batch_number")
    .notNull()
    .unique()
    .default(sql`'PBATCH-' || lpad(nextval('product_batch_code_seq')::text, 4, '0')`), // PBATCH-0001
  productId: uuid("product_id").notNull().references(() => products.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  purchaseDate: date("purchase_date").notNull(),
  purchaseCostCents: integer("purchase_cost_cents").notNull().default(0),
  originalQuantity: integer("original_quantity").notNull(),
  remainingQuantity: integer("remaining_quantity").notNull(),
  // Decimal cents (like string batches) — purchaseCostCents / originalQuantity
  // is not always a whole number of cents (e.g. $100 / 3 units).
  costPerUnitCents: numeric("cost_per_unit_cents", { precision: 12, scale: 4 }).notNull(),
  supplierReference: text("supplier_reference"),
  notes: text("notes"),
  status: inventoryBatchStatusEnum("status").notNull().default("active"),
  isOpeningStock: boolean("is_opening_stock").notNull().default(false),
  ...timestamps,
});

export const productMovementTypeEnum = pgEnum("product_movement_type", [
  "received", // stock received (incl. opening stock, flagged via the batch)
  "sale", // sold through POS
  "return", // returned by a customer, restocked
  "return_no_restock", // returned but not fit to resell — refunded, not restocked
  "manual_add",
  "manual_deduct",
  "wastage",
  "correction", // stocktake correction to an exact remaining quantity
  "reversal", // reverses an earlier movement (sale cancelled, cost corrected, ...)
]);

// The append-only ledger — current stock is always sum(quantityChange) over
// a batch's movements, never a field the app overwrites directly. Same
// philosophy as string_inventory_movements (brief §6/§52).
export const productInventoryMovements = pgTable("product_inventory_movements", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id),
  batchId: uuid("batch_id").notNull().references(() => productInventoryBatches.id),
  movementType: productMovementTypeEnum("movement_type").notNull(),
  quantityChange: integer("quantity_change").notNull(),
  costPerUnitCentsSnapshot: numeric("cost_per_unit_cents_snapshot", { precision: 12, scale: 4 }).notNull(),
  saleId: uuid("sale_id").references(() => sales.id),
  saleItemId: uuid("sale_item_id").references(() => saleItems.id),
  reversesMovementId: uuid("reverses_movement_id"),
  stockOverride: boolean("stock_override").notNull().default(false),
  reason: text("reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

// -- work and money -------------------------------------------------

export const paymentMethodEnum = pgEnum("payment_method", ["paynow", "cash", "transfer", "card", "other"]);

export const jobStatusEnum = pgEnum("job_status", ["received", "waiting", "in_progress", "completed", "collected", "cancelled"]);
export const stringSetupTypeEnum = pgEnum("string_setup_type", ["full", "hybrid"]);
export const tensionUnitEnum = pgEnum("tension_unit", ["kg", "lb"]);
export const preStretchTypeEnum = pgEnum("pre_stretch_type", ["none", "manual", "machine"]);
// A string job also tracks a deposit/partial-payment state day to day. Once
// a job has a linked Sale (saleId below), this column is frozen at whatever
// it read at completion time and the UI displays the Sale's own derived
// payment status instead (brief §56) — Sales are the financial source of
// truth from Phase 6 on; this stays live only for jobs with no linked Sale.
export const jobPaymentStatusEnum = pgEnum("job_payment_status", ["unpaid", "partially_paid", "paid"]);

// A physical racket's stringing record. Phase 4.
//
// Money/knots/pre-stretch/notes live here, not on customer_rackets or
// racket_models, because the same physical racket is restrung repeatedly,
// often differently each time — see docs/architecture.html §03's snapshot
// rule and the Phase 4 brief's explicit "do not tie knots to the master
// racket model" note. finalPriceCents is the snapshot total (sum of this
// job's string_job_services rows, minus discountCents) computed at save
// time — never recomputed from current service prices, so a historical job
// keeps showing what was actually charged even after prices change later.
export const stringJobs = pgTable("string_jobs", {
  id: id(),
  code: text("code")
    .notNull()
    .unique()
    .default(sql`'J' || lpad(nextval('job_code_seq')::text, 4, '0')`), // J0001
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  customerRacketId: uuid("customer_racket_id").notNull().references(() => customerRackets.id),
  setupType: stringSetupTypeEnum("setup_type").notNull(),
  status: jobStatusEnum("status").notNull().default("received"),
  // Calendar dates the stringer sets by hand (defaults to today, editable) —
  // unlike completedAt/collectedAt below, which are real timestamps written
  // automatically the moment a status change happens.
  receivedOn: date("received_on").notNull(),
  dueOn: date("due_on"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  numberOfKnots: integer("number_of_knots"),
  preStretchType: preStretchTypeEnum("pre_stretch_type").notNull().default("none"),
  preStretchPct: numeric("pre_stretch_pct", { precision: 5, scale: 2 }),
  paymentStatus: jobPaymentStatusEnum("payment_status").notNull().default("unpaid"),
  paymentMethod: paymentMethodEnum("payment_method"),
  discountCents: integer("discount_cents").notNull().default(0),
  finalPriceCents: integer("final_price_cents").notNull().default(0), // snapshot
  generalNotes: text("general_notes"), // customer-facing ("wants a softer feel")
  stringingNotes: text("stringing_notes"), // internal ("grommet wear at 12 o'clock")
  // snapshots — survive edits to the customer/racket records afterwards
  racketLabel: text("racket_label").notNull(),
  customerName: text("customer_name").notNull(),
  // Phase 5 idempotency guard: set exactly once, the moment this job's
  // SportCraft-stock strings are FIFO-allocated and deducted (see
  // changeJobStatus in src/lib/jobs.ts). A concurrent duplicate "mark
  // completed" click finds this already set and skips reprocessing —
  // one logical inventory deduction per job, no matter how many times the
  // status changes or the page is refreshed. Cleared back to null by a
  // reversal (e.g. cancelling a completed job), so a later re-completion
  // allocates fresh.
  inventoryProcessedAt: timestamp("inventory_processed_at", { withTimezone: true }),
  // Phase 6 — set once, the same moment inventoryProcessedAt is (first time
  // reaching "completed"), never cleared afterwards even if the job is
  // later reverted/re-completed (mirrors completedAt's "first time only"
  // semantics). No DB-level FK here deliberately — a stringJobs -> sales
  // reference plus sales' own stringJobId -> stringJobs reference is a
  // genuine type-level circular dependency Drizzle/TS can't infer through.
  // sales.stringJobId (UNIQUE, defined below) is the constrained, enforced
  // direction — that's what actually makes "one job, at most one Sale"
  // impossible to violate; this column is just the job's own convenient
  // pointer to it, kept in sync in the same transaction that sets the
  // other side. See createJobSale in src/lib/sales.ts.
  saleId: uuid("sale_id"),
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stringRoleEnum = pgEnum("string_role", ["main", "cross"]);

// -- string inventory (Phase 5) -------------------------------------------
//
// A dedicated catalogue/ledger for strings, deliberately separate from the
// `products`/`productInventoryBatches`/`productInventoryMovements` general
// retail catalogue (Phase 6, above) — the Phase 5 brief is explicit that
// strings need their own structured catalogue (brand/name/gauge/colour/
// material) distinct from a generic SKU/category product row. A string
// reel/set that's sold retail is never duplicated into `products`; a Sale
// Item references stringProductId directly instead (see the Phase 6 sales
// section below). stringJobStrings.stringProductId (below) is the
// non-destructive link back to a job — same pattern as
// customer_rackets.racket_model_id.

export const stringStockUnitEnum = pgEnum("string_stock_unit", ["m", "set"]);

// One row per sellable variant (brand+name+gauge+colour+material) — never
// duplicated just because the purchase price changed; that's what batches
// are for (brief §2/§4). trackingUnit is fixed per product (not per batch):
// a given variant is always sold as reels-in-metres or as whole sets, never
// mixed, which keeps "stock available" a single unambiguous number.
export const stringProducts = pgTable("string_products", {
  id: id(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  gauge: numeric("gauge", { precision: 3, scale: 2 }),
  colour: text("colour"),
  // Free text, not an enum — the brief is explicit that material categories
  // (polyester, co-poly, multifilament, gut, ...) must never be hard-coded
  // shut against a new one appearing.
  material: text("material"),
  sku: text("sku"),
  trackingUnit: stringStockUnitEnum("tracking_unit").notNull().default("m"),
  defaultSellingPriceCents: integer("default_selling_price_cents"),
  // Per-product override; falls back to the global default in `settings`
  // (key "inventory_defaults") when null.
  lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale: 2 }),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// One purchase/receipt event — the FIFO costing unit (brief §6/§9). unit
// mirrors the product's trackingUnit at receipt time (a product's tracking
// unit isn't expected to change once batches exist against it).
// costPerUnit is a decimal number of cents (not an integer) because a
// per-metre rate is inherently fractional (e.g. $185/200m = 92.5¢/m) — only
// the derived COGS/movement dollar amounts round to integer cents.
export const stringInventoryBatches = pgTable("string_inventory_batches", {
  id: id(),
  batchNumber: text("batch_number")
    .notNull()
    .unique()
    .default(sql`'BATCH-' || lpad(nextval('batch_code_seq')::text, 4, '0')`), // BATCH-0001
  stringProductId: uuid("string_product_id").notNull().references(() => stringProducts.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  purchaseDate: date("purchase_date").notNull(),
  purchaseCostCents: integer("purchase_cost_cents").notNull().default(0),
  originalQuantity: numeric("original_quantity", { precision: 10, scale: 2 }).notNull(),
  remainingQuantity: numeric("remaining_quantity", { precision: 10, scale: 2 }).notNull(),
  unit: stringStockUnitEnum("unit").notNull(),
  costPerUnitCents: numeric("cost_per_unit_cents", { precision: 12, scale: 4 }).notNull(),
  supplierReference: text("supplier_reference"),
  notes: text("notes"),
  status: inventoryBatchStatusEnum("status").notNull().default("active"),
  // Opening stock (brief §43) — a starting balance entered to get the
  // system going, distinguishable from a real purchase receipt even though
  // it's stored the same way (its own batch + a "received" movement).
  isOpeningStock: boolean("is_opening_stock").notNull().default(false),
  ...timestamps,
});

export const stringMovementTypeEnum = pgEnum("string_movement_type", [
  "received", // stock received (incl. opening stock, flagged via the batch)
  "string_job", // consumed by a string job
  "retail_sale", // Phase 6 — a whole reel/set sold directly through POS, not used in a job (brief §8/§9)
  "manual_add",
  "manual_deduct",
  "wastage",
  "correction", // stocktake correction to an exact remaining quantity
  "reversal", // reverses an earlier movement (job edit/cancel, a sale cancelled/returned, or a correction of a mistaken manual entry)
]);

// The append-only ledger (brief §1/§20) — current stock is always
// sum(quantityChange) over a batch's movements, never a field the app
// overwrites directly. Nothing here is ever edited or deleted after the
// fact; corrections and reversals are new rows.
export const stringInventoryMovements = pgTable("string_inventory_movements", {
  id: id(),
  stringProductId: uuid("string_product_id").notNull().references(() => stringProducts.id),
  batchId: uuid("batch_id").notNull().references(() => stringInventoryBatches.id),
  movementType: stringMovementTypeEnum("movement_type").notNull(),
  quantityChange: numeric("quantity_change", { precision: 10, scale: 2 }).notNull(),
  unit: stringStockUnitEnum("unit").notNull(),
  costPerUnitCentsSnapshot: numeric("cost_per_unit_cents_snapshot", { precision: 12, scale: 4 }).notNull(),
  stringJobId: uuid("string_job_id").references(() => stringJobs.id),
  stringJobRole: stringRoleEnum("string_job_role"),
  // Phase 6 — set for a retail_sale movement (a whole reel/set sold
  // through POS) instead of stringJobId/stringJobRole above. Never both:
  // a movement is either a job's consumption or a retail sale, not both.
  saleId: uuid("sale_id").references(() => sales.id),
  saleItemId: uuid("sale_item_id").references(() => saleItems.id),
  // Points at the original movement this row reverses (movementType =
  // 'reversal' only) — lets the ledger show "+10.5m — Reversal of J0042"
  // linked straight back to the "-10.5m — String job J0042" row it undoes.
  reversesMovementId: uuid("reverses_movement_id"),
  // True when this movement was allowed to push a batch/product below zero
  // (brief §19) — an explicit, confirmed override, never silent.
  stockOverride: boolean("stock_override").notNull().default(false),
  reason: text("reason"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
});

// Phase 6 — the retail-sale equivalent of string_job_inventory_allocations
// above, for a whole reel/set sold directly through POS rather than
// consumed by a job. Same reasoning throughout: one row per FIFO batch
// touched, reversedAt marks a row undone by a cancelled/returned sale
// rather than deleting it.
export const saleItemStringAllocations = pgTable("sale_item_string_allocations", {
  id: id(),
  saleItemId: uuid("sale_item_id").notNull().references(() => saleItems.id, { onDelete: "cascade" }),
  inventoryBatchId: uuid("inventory_batch_id").notNull().references(() => stringInventoryBatches.id),
  quantityUsed: numeric("quantity_used", { precision: 10, scale: 2 }).notNull(),
  costPerUnitSnapshot: numeric("cost_per_unit_snapshot", { precision: 12, scale: 4 }).notNull(),
  cogsAmountCents: integer("cogs_amount_cents").notNull(),
  movementId: uuid("movement_id").references(() => stringInventoryMovements.id),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  ...timestamps,
});

// One row per FIFO batch consumed by one side (main/cross) of one job —
// a hybrid job using two SportCraft strings gets two rows, one full-bed job
// short on stock gets two rows (one per batch it drew from). Keyed by
// (stringJobId, role) rather than a stringJobStrings row id: updateJob does
// a full delete+reinsert of string_job_strings on every edit (see
// src/lib/jobs.ts), which would otherwise orphan a row-id foreign key the
// moment a job with existing allocations was edited at all. role is stable
// across edits (a job always has exactly one main + one cross row), so it
// survives that replace safely.
export const stringJobInventoryAllocations = pgTable("string_job_inventory_allocations", {
  id: id(),
  stringJobId: uuid("string_job_id").notNull().references(() => stringJobs.id, { onDelete: "cascade" }),
  role: stringRoleEnum("role").notNull(),
  inventoryBatchId: uuid("inventory_batch_id").notNull().references(() => stringInventoryBatches.id),
  quantityUsed: numeric("quantity_used", { precision: 10, scale: 2 }).notNull(),
  costPerUnitSnapshot: numeric("cost_per_unit_snapshot", { precision: 12, scale: 4 }).notNull(),
  cogsAmountCents: integer("cogs_amount_cents").notNull(),
  movementId: uuid("movement_id").references(() => stringInventoryMovements.id),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  ...timestamps,
});

// -- string jobs (Phase 4) -------------------------------------------------

// Always exactly two rows per job — main and cross — even for a full bed,
// where both rows snapshot the same string but keep independent tensions
// (the brief is explicit that a full bed can still be strung at different
// main/cross tensions). Hybrid rows simply differ in string identity too.
// This is a deliberate change from the brief's suggested "position: full |
// main | cross" — a single "full" row can't hold two tensions, and having
// exactly 2 rows always keeps every join/query uniform regardless of setup
// type, instead of branching on setupType to know how many rows to expect.
export const stringJobStrings = pgTable("string_job_strings", {
  id: id(),
  stringJobId: uuid("string_job_id").notNull().references(() => stringJobs.id, { onDelete: "cascade" }),
  role: stringRoleEnum("role").notNull(),
  // Non-destructive link to the Phase 5 string catalogue (brief §17) — set
  // only for SportCraft Stock strings, never for customer-supplied ones.
  // Renaming/archiving the linked product later never touches the
  // brand/string/gauge/colour snapshots below, so a historical job stays
  // readable exactly as it was strung.
  stringProductId: uuid("string_product_id").references(() => stringProducts.id),
  customerSupplied: boolean("customer_supplied").notNull().default(false),
  // Structured, not one free-text field (brief §12) — and always a
  // snapshot, never a live join to a product name/price that could change.
  brandSnapshot: text("brand_snapshot").notNull(),
  stringNameSnapshot: text("string_name_snapshot").notNull(),
  gaugeSnapshot: numeric("gauge_snapshot", { precision: 3, scale: 2 }),
  colourSnapshot: text("colour_snapshot"),
  tension: numeric("tension", { precision: 5, scale: 2 }).notNull(),
  tensionUnit: tensionUnitEnum("tension_unit").notNull().default("lb"),
  // Actual string used (brief §11/§12) — required to FIFO-deduct a
  // SportCraft Stock line; optional/informational for customer-supplied.
  // unit is a snapshot of the linked product's trackingUnit at save time.
  quantityUsed: numeric("quantity_used", { precision: 10, scale: 2 }),
  usageUnit: stringStockUnitEnum("usage_unit"),
  // True if this line was completed despite insufficient stock, via the
  // explicit override in the job completion flow (brief §19) — surfaced on
  // the job and in the inventory movement it produced, never silent.
  stockOverride: boolean("stock_override").notNull().default(false),
});

// Line items — stringing labour, string charge, grip replacement, and any
// custom service all go here rather than as fixed columns on string_jobs
// (brief §17/§18/§32). unitPriceCents/totalCents are snapshots: editing a
// job later never recomputes an old line from today's prices.
export const stringJobServices = pgTable("string_job_services", {
  id: id(),
  stringJobId: uuid("string_job_id").notNull().references(() => stringJobs.id, { onDelete: "cascade" }),
  serviceName: text("service_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  notes: text("notes"),
});

// -- sales (Phase 6) --------------------------------------------------------
//
// The financial source of truth from Phase 6 on (brief §26/§70) — a
// string job's own finalPriceCents/paymentStatus are the operational quote
// and day-to-day tracking, never counted as revenue a second time
// alongside a Sale. See src/lib/sales.ts's file-level comment for the full
// "how double counting is prevented" writeup.

export const saleStatusEnum = pgEnum("sale_status", ["draft", "completed", "cancelled", "refunded", "partially_refunded"]);
export const salePaymentStatusEnum = pgEnum("sale_payment_status", ["unpaid", "partially_paid", "paid", "refunded"]);
export const saleItemTypeEnum = pgEnum("sale_item_type", ["product", "string_product", "string_job_service", "custom"]);
export const saleDiscountTypeEnum = pgEnum("sale_discount_type", ["fixed", "percent"]);

export const sales = pgTable("sales", {
  id: id(),
  code: text("code")
    .notNull()
    .unique()
    .default(sql`'S' || lpad(nextval('sale_code_seq')::text, 4, '0')`), // S0001
  customerId: uuid("customer_id").references(() => customers.id), // nullable — walk-in
  // UNIQUE — a string job can create at most one linked Sale, ever (brief
  // §25/§27). A second attempt is a database error, not a duplicate revenue
  // row — the same double-billing guard the old stub put on sale_items,
  // moved here since a job-linked Sale can hold several sale_items (string
  // charge, labour, an attached retail product, ...), not just one.
  stringJobId: uuid("string_job_id").unique().references(() => stringJobs.id),
  // The one explicit, dedicated revenue date (brief §45) — never inferred
  // from a customer's/job's/inventory movement's own created_at elsewhere.
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  status: saleStatusEnum("status").notNull().default("completed"),
  subtotalCents: integer("subtotal_cents").notNull(),
  // discountType/discountValue are the edit-facing "how the discount was
  // entered" (10% vs a flat $5) — discountCents is the resolved amount
  // actually applied, the snapshot that totalCents is computed from and the
  // only one anything downstream (reports, the receipt) should ever read.
  discountType: saleDiscountTypeEnum("discount_type"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  // Derived from sale_payments (sum vs totalCents) and kept in sync by
  // every write to that table — never set directly except by that
  // recomputation, so it can't drift from what's actually been paid.
  paymentStatus: salePaymentStatusEnum("payment_status").notNull().default("unpaid"),
  reversesSaleId: uuid("reverses_sale_id"),
  // Checkout idempotency (brief §51) — the POS generates one id per checkout
  // attempt and resubmits the same one on a retry; createSale looks this up
  // first and returns the existing Sale instead of creating a second one on
  // a double-click, refresh, or network retry.
  clientRequestId: text("client_request_id").unique(),
  notes: text("notes"),
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// A Sale Item never itself points back at stringJobId — the parent Sale
// already does that (via sales.stringJobId, which is what's UNIQUE), so a
// second column here would just be a redundant copy with nothing new to
// enforce. itemType='string_job_service' plus the parent Sale's stringJobId
// is enough to tell "this line is part of the job's own charges" apart from
// "this line is a retail product also bought at the same checkout" (brief
// §29), without an extra FK that could theoretically disagree with it.
export const saleItems = pgTable("sale_items", {
  id: id(),
  saleId: uuid("sale_id").notNull().references(() => sales.id),
  itemType: saleItemTypeEnum("item_type").notNull(),
  productId: uuid("product_id").references(() => products.id),
  // Set for a retail full-reel/set sale AND for a string_job_service line
  // that represents the string charge itself (COGS traceability back to
  // the actual string — brief §28).
  stringProductId: uuid("string_product_id").references(() => stringProducts.id),
  descriptionSnapshot: text("description_snapshot").notNull(),
  skuSnapshot: text("sku_snapshot"),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  // The catalogue price before any override, vs. what was actually charged
  // (brief §20) — the product's own default price is never touched by a
  // one-off override here.
  standardPriceCentsSnapshot: integer("standard_price_cents_snapshot").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  lineTotalCents: integer("line_total_cents").notNull(),
  cogsAmountCents: integer("cogs_amount_cents").notNull().default(0),
  grossProfitCents: integer("gross_profit_cents").notNull().default(0),
  // Cumulative quantity returned against this line (brief §34, partial
  // returns) — the original snapshot fields above are never rewritten;
  // "net" revenue/COGS for display is derived at read time from this plus
  // the reversing Sale(s) it produced.
  returnedQuantity: numeric("returned_quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  ...timestamps,
});

// One row per FIFO batch consumed by one retail sale item — the Phase 6
// equivalent of string_job_inventory_allocations, same reasoning.
export const saleItemInventoryAllocations = pgTable("sale_item_inventory_allocations", {
  id: id(),
  saleItemId: uuid("sale_item_id").notNull().references(() => saleItems.id, { onDelete: "cascade" }),
  inventoryBatchId: uuid("inventory_batch_id").notNull().references(() => productInventoryBatches.id),
  quantityUsed: integer("quantity_used").notNull(),
  costPerUnitSnapshot: numeric("cost_per_unit_snapshot", { precision: 12, scale: 4 }).notNull(),
  cogsAmountCents: integer("cogs_amount_cents").notNull(),
  movementId: uuid("movement_id").references(() => productInventoryMovements.id),
  reversedAt: timestamp("reversed_at", { withTimezone: true }),
  ...timestamps,
});

// Split-payment ready (brief §24) — a Sale's paymentStatus is always
// derived from summing these against totalCents, never set by hand. Kept
// simple on the POS UI (one payment at checkout); the Sale detail page can
// record more later (e.g. "$20 PayNow now, $15 Cash at collection").
export const salePayments = pgTable("sale_payments", {
  id: id(),
  saleId: uuid("sale_id").notNull().references(() => sales.id),
  amountCents: integer("amount_cents").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentDate: timestamp("payment_date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  ...timestamps,
});

export const expenseCategories = pgTable("expense_categories", {
  id: id(),
  name: text("name").notNull(),
  // Stock purchases are never recorded here — see docs/architecture.html §05,
  // "the inventory-vs-expense trap". This flag excludes a category from opex.
  isInventory: boolean("is_inventory").notNull().default(false),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

export const expenses = pgTable("expenses", {
  id: id(),
  incurredOn: date("incurred_on").notNull(),
  categoryId: uuid("category_id").notNull().references(() => expenseCategories.id),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  paymentMethod: text("payment_method").notNull(),
  notes: text("notes"),
});

// Business name, currency, default labour charge, default string usage,
// payment methods, expense/product categories, job statuses, low-stock
// thresholds — one JSON document per settings key.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
