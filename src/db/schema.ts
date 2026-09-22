// SportCraft — Drizzle schema, stubbed against the design in docs/architecture.html
// (sections 03–06: database schema, relationships, the no-double-counting revenue
// rule, and batch-level FIFO reel costing).
//
// This is not wired to a live database yet — the dashboard still reads
// src/lib/data.ts. Once a Supabase/Postgres connection string exists, add
// `src/db/client.ts` (drizzle(postgres(...))) and drizzle-kit migrations against
// this file; nothing here should need to change to do that.
//
// Conventions: money is integer cents, lengths are numeric(10,2) metres, every
// timestamp is timestamptz. Every customer/job/sale-facing row gets a short code
// (`C-0231`, `SC-1042`) alongside its uuid primary key. Columns comprising the
// "snapshot rule" (never recomputed after the transaction) are marked below.

import { boolean, date, integer, jsonb, numeric, pgEnum, pgSequence, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const id = () => uuid("id").defaultRandom().primaryKey();
const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() };

// Human-readable IDs (C0001, R0001, J0001, ...). A DB sequence keeps
// generation atomic under concurrent inserts and monotonic even as rows are
// archived/cancelled (never reused, never re-derived from a row count).
export const customerCodeSeq = pgSequence("customer_code_seq", { startWith: 1, minValue: 1 });
export const racketCodeSeq = pgSequence("racket_code_seq", { startWith: 1, minValue: 1 });
export const jobCodeSeq = pgSequence("job_code_seq", { startWith: 1, minValue: 1 });

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
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
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

export const suppliers = pgTable("suppliers", {
  id: id(),
  name: text("name").notNull(),
  notes: text("notes"),
});

export const stockModeEnum = pgEnum("stock_mode", ["unit", "length"]);

export const products = pgTable("products", {
  id: id(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  brand: text("brand"),
  category: text("category").notNull(),
  variant: text("variant"),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  stockMode: stockModeEnum("stock_mode").notNull(),
  unitLabel: text("unit_label").notNull(), // set | reel | pcs
  sellPriceCents: integer("sell_price_cents").notNull(),
  reorderLevel: numeric("reorder_level", { precision: 10, scale: 2 }),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  // length-mode only (string reels/sets)
  gaugeMm: numeric("gauge_mm", { precision: 4, scale: 2 }),
  colour: text("colour"),
  material: text("material"),
  reelLengthM: numeric("reel_length_m", { precision: 6, scale: 1 }),
});

// unit_cost_cents is per metre for reels, per unit otherwise.
export const inventoryBatches = pgTable("inventory_batches", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  supplierId: uuid("supplier_id").references(() => suppliers.id),
  qtyReceived: numeric("qty_received", { precision: 10, scale: 2 }).notNull(),
  qtyRemaining: numeric("qty_remaining", { precision: 10, scale: 2 }).notNull(),
  unitCostCents: integer("unit_cost_cents").notNull(), // snapshot at receipt
});

export const movementTypeEnum = pgEnum("movement_type", [
  "purchase",
  "sale",
  "string_job",
  "adjustment",
  "return",
  "write_off",
]);

// Quantity on hand is sum(qty_delta) over these rows, never a stored field.
export const inventoryMovements = pgTable("inventory_movements", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id),
  batchId: uuid("batch_id").references(() => inventoryBatches.id),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  qtyDelta: numeric("qty_delta", { precision: 10, scale: 2 }).notNull(),
  unitCostCents: integer("unit_cost_cents").notNull(), // snapshot
  movementType: movementTypeEnum("movement_type").notNull(),
  refTable: text("ref_table"),
  refId: uuid("ref_id"),
  notes: text("notes"),
});

// -- work and money -------------------------------------------------

export const paymentMethodEnum = pgEnum("payment_method", ["paynow", "cash", "transfer", "card", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "unpaid"]);

export const jobStatusEnum = pgEnum("job_status", ["received", "waiting", "in_progress", "completed", "collected", "cancelled"]);
export const stringSetupTypeEnum = pgEnum("string_setup_type", ["full", "hybrid"]);
export const tensionUnitEnum = pgEnum("tension_unit", ["kg", "lb"]);
export const preStretchTypeEnum = pgEnum("pre_stretch_type", ["none", "manual", "machine"]);
// Distinct from paymentStatusEnum (sales, Phase 6: paid/unpaid only) — a
// string job also tracks a deposit/partial-payment state day to day, before
// Phase 6 makes a Sale the actual financial source of truth.
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
  ...timestamps,
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stringRoleEnum = pgEnum("string_role", ["main", "cross"]);

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
  // Nullable until Phase 5 builds real string inventory (see brief §33) —
  // once it exists, backfilling this onto historical rows links them to a
  // product without touching brandSnapshot/etc., same non-destructive-link
  // pattern as customer_rackets.racket_model_id in Phase 3.
  stringProductId: uuid("string_product_id").references(() => products.id),
  customerSupplied: boolean("customer_supplied").notNull().default(false),
  // Structured, not one free-text field (brief §12) — and always a
  // snapshot, never a live join to a product name/price that could change.
  brandSnapshot: text("brand_snapshot").notNull(),
  stringNameSnapshot: text("string_name_snapshot").notNull(),
  gaugeSnapshot: numeric("gauge_snapshot", { precision: 3, scale: 2 }),
  colourSnapshot: text("colour_snapshot"),
  tension: numeric("tension", { precision: 5, scale: 2 }).notNull(),
  tensionUnit: tensionUnitEnum("tension_unit").notNull().default("lb"),
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

export const sales = pgTable("sales", {
  id: id(),
  code: text("code").notNull().unique(), // S-0884
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  customerId: uuid("customer_id").references(() => customers.id), // nullable — walk-in
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("paid"),
  reversesSaleId: uuid("reverses_sale_id"),
  notes: text("notes"),
});

export const saleLineTypeEnum = pgEnum("sale_line_type", ["product", "string_job", "service"]);

export const saleItems = pgTable(
  "sale_items",
  {
    id: id(),
    saleId: uuid("sale_id").notNull().references(() => sales.id),
    lineType: saleLineTypeEnum("line_type").notNull(),
    productId: uuid("product_id").references(() => products.id),
    // UNIQUE — a string job can be billed exactly once, ever. A second attempt
    // is a database error, not a duplicate revenue row. This is the constraint
    // that makes double-billing impossible (see docs/architecture.html, §05).
    stringJobId: uuid("string_job_id").references(() => stringJobs.id),
    description: text("description").notNull(), // snapshot
    qty: numeric("qty", { precision: 10, scale: 2 }).notNull().default("1"),
    unitPriceCents: integer("unit_price_cents").notNull(), // snapshot
    lineTotalCents: integer("line_total_cents").notNull(),
    cogsCents: integer("cogs_cents").notNull().default(0), // snapshot
    revenueCategory: text("revenue_category").notNull(),
  },
  (table) => [unique("sale_items_string_job_id_unique").on(table.stringJobId)],
);

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
