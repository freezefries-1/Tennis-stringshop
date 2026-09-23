CREATE TYPE "public"."product_movement_type" AS ENUM('received', 'sale', 'return', 'return_no_restock', 'manual_add', 'manual_deduct', 'wastage', 'correction', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."sale_discount_type" AS ENUM('fixed', 'percent');--> statement-breakpoint
CREATE TYPE "public"."sale_item_type" AS ENUM('product', 'string_product', 'string_job_service', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sale_payment_status" AS ENUM('unpaid', 'partially_paid', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('draft', 'completed', 'cancelled', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE SEQUENCE "public"."product_batch_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."product_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."sale_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "product_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" text DEFAULT 'PBATCH-' || lpad(nextval('product_batch_code_seq')::text, 4, '0') NOT NULL,
	"product_id" uuid NOT NULL,
	"supplier_id" uuid,
	"purchase_date" date NOT NULL,
	"purchase_cost_cents" integer DEFAULT 0 NOT NULL,
	"original_quantity" integer NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"cost_per_unit_cents" numeric(12, 4) NOT NULL,
	"supplier_reference" text,
	"notes" text,
	"status" "inventory_batch_status" DEFAULT 'active' NOT NULL,
	"is_opening_stock" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_inventory_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "product_inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"movement_type" "product_movement_type" NOT NULL,
	"quantity_change" integer NOT NULL,
	"cost_per_unit_cents_snapshot" numeric(12, 4) NOT NULL,
	"sale_id" uuid,
	"sale_item_id" uuid,
	"reverses_movement_id" uuid,
	"stock_override" boolean DEFAULT false NOT NULL,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT 'P' || lpad(nextval('product_code_seq')::text, 4, '0') NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category_id" uuid NOT NULL,
	"variant" text,
	"sku" text,
	"barcode" text,
	"default_selling_price_cents" integer,
	"cost_price_cents" integer,
	"low_stock_threshold" integer,
	"supplier_id" uuid,
	"track_inventory" boolean DEFAULT true NOT NULL,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_code_unique" UNIQUE("code"),
	CONSTRAINT "products_sku_unique" UNIQUE("sku"),
	CONSTRAINT "products_barcode_unique" UNIQUE("barcode")
);
--> statement-breakpoint
CREATE TABLE "sale_item_inventory_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_item_id" uuid NOT NULL,
	"inventory_batch_id" uuid NOT NULL,
	"quantity_used" integer NOT NULL,
	"cost_per_unit_snapshot" numeric(12, 4) NOT NULL,
	"cogs_amount_cents" integer NOT NULL,
	"movement_id" uuid,
	"reversed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"item_type" "sale_item_type" NOT NULL,
	"product_id" uuid,
	"string_product_id" uuid,
	"description_snapshot" text NOT NULL,
	"sku_snapshot" text,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"standard_price_cents_snapshot" integer NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"line_total_cents" integer NOT NULL,
	"cogs_amount_cents" integer DEFAULT 0 NOT NULL,
	"gross_profit_cents" integer DEFAULT 0 NOT NULL,
	"returned_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT 'S' || lpad(nextval('sale_code_seq')::text, 4, '0') NOT NULL,
	"customer_id" uuid,
	"string_job_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "sale_status" DEFAULT 'completed' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"discount_type" "sale_discount_type",
	"discount_value" numeric(10, 2),
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"payment_status" "sale_payment_status" DEFAULT 'unpaid' NOT NULL,
	"reverses_sale_id" uuid,
	"client_request_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_code_unique" UNIQUE("code"),
	CONSTRAINT "sales_string_job_id_unique" UNIQUE("string_job_id"),
	CONSTRAINT "sales_client_request_id_unique" UNIQUE("client_request_id")
);
--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "sale_id" uuid;--> statement-breakpoint
ALTER TABLE "product_inventory_batches" ADD CONSTRAINT "product_inventory_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory_batches" ADD CONSTRAINT "product_inventory_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory_movements" ADD CONSTRAINT "product_inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory_movements" ADD CONSTRAINT "product_inventory_movements_batch_id_product_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory_movements" ADD CONSTRAINT "product_inventory_movements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_inventory_movements" ADD CONSTRAINT "product_inventory_movements_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_inventory_allocations" ADD CONSTRAINT "sale_item_inventory_allocations_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_inventory_allocations" ADD CONSTRAINT "sale_item_inventory_allocations_inventory_batch_id_product_inventory_batches_id_fk" FOREIGN KEY ("inventory_batch_id") REFERENCES "public"."product_inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_inventory_allocations" ADD CONSTRAINT "sale_item_inventory_allocations_movement_id_product_inventory_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."product_inventory_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_string_product_id_string_products_id_fk" FOREIGN KEY ("string_product_id") REFERENCES "public"."string_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_payments" ADD CONSTRAINT "sale_payments_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_inventory_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_inventory_movements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sale_item_inventory_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sale_payments" ENABLE ROW LEVEL SECURITY;