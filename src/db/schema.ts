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

import { boolean, date, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

const id = () => uuid("id").defaultRandom().primaryKey();
const timestamps = { createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull() };

// -- people and their frames -------------------------------------------------

export const customers = pgTable("customers", {
  id: id(),
  code: text("code").notNull().unique(), // C-0231
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

export const racketModels = pgTable("racket_models", {
  id: id(),
  seriesId: uuid("series_id").notNull().references(() => racketSeries.id),
  model: text("model").notNull(),
  generationYear: integer("generation_year"),
  headSizeSqin: numeric("head_size_sqin", { precision: 6, scale: 2 }),
  stringPattern: text("string_pattern"),
  unstrungWeightG: integer("unstrung_weight_g"),
  notes: text("notes"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// Two identical frames owned by the same customer are two rows pointing at the
// same racket_model_id — never merged into one.
export const customerRackets = pgTable("customer_rackets", {
  id: id(),
  code: text("code").notNull().unique(), // R-0417
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  racketModelId: uuid("racket_model_id").notNull().references(() => racketModels.id),
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

export const jobStatusEnum = pgEnum("job_status", ["received", "waiting", "in_progress", "completed", "collected"]);
export const tensionUnitEnum = pgEnum("tension_unit", ["kg", "lb"]);

export const stringJobs = pgTable("string_jobs", {
  id: id(),
  code: text("code").notNull().unique(), // SC-1042
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  customerRacketId: uuid("customer_racket_id").notNull().references(() => customerRackets.id),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  status: jobStatusEnum("status").notNull().default("received"),
  tensionUnit: tensionUnitEnum("tension_unit").notNull().default("kg"),
  preStretchPct: numeric("pre_stretch_pct", { precision: 5, scale: 2 }),
  customerSuppliedString: boolean("customer_supplied_string").notNull().default(false),
  labourChargeCents: integer("labour_charge_cents").notNull(),
  additionalChargesCents: integer("additional_charges_cents").notNull().default(0),
  notes: text("notes"),
  // snapshots — survive edits to the customer/racket records afterwards
  racketLabel: text("racket_label").notNull(),
  customerName: text("customer_name").notNull(),
});

export const stringRoleEnum = pgEnum("string_role", ["main", "cross"]);

// One row for a full bed (role 'main'), two for a hybrid.
export const stringJobStrings = pgTable("string_job_strings", {
  id: id(),
  stringJobId: uuid("string_job_id").notNull().references(() => stringJobs.id),
  role: stringRoleEnum("role").notNull(),
  productId: uuid("product_id").notNull().references(() => products.id),
  batchId: uuid("batch_id").references(() => inventoryBatches.id),
  lengthUsedM: numeric("length_used_m", { precision: 6, scale: 2 }).notNull(),
  tension: text("tension").notNull(),
});

export const paymentMethodEnum = pgEnum("payment_method", ["paynow", "cash", "transfer", "card", "other"]);
export const paymentStatusEnum = pgEnum("payment_status", ["paid", "unpaid"]);

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
