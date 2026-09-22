CREATE TYPE "public"."job_status" AS ENUM('received', 'waiting', 'in_progress', 'completed', 'collected');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('purchase', 'sale', 'string_job', 'adjustment', 'return', 'write_off');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('paynow', 'cash', 'transfer', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."sale_line_type" AS ENUM('product', 'string_job', 'service');--> statement-breakpoint
CREATE TYPE "public"."stock_mode" AS ENUM('unit', 'length');--> statement-breakpoint
CREATE TYPE "public"."string_role" AS ENUM('main', 'cross');--> statement-breakpoint
CREATE TYPE "public"."tension_unit" AS ENUM('kg', 'lb');--> statement-breakpoint
CREATE SEQUENCE "public"."customer_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."racket_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "customer_rackets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT 'R' || lpad(nextval('racket_code_seq')::text, 4, '0') NOT NULL,
	"customer_id" uuid NOT NULL,
	"racket_model_id" uuid,
	"brand" text,
	"series" text,
	"model" text,
	"generation_year" integer,
	"head_size_sqin" numeric(6, 2),
	"string_pattern" text,
	"grip_size" text,
	"static_weight_g" integer,
	"swingweight" integer,
	"balance_mm" integer,
	"customisation_notes" text,
	"notes" text,
	"archived_at" timestamp with time zone,
	CONSTRAINT "customer_rackets_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text DEFAULT 'C' || lpad(nextval('customer_code_seq')::text, 4, '0') NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "customers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_inventory" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incurred_on" date NOT NULL,
	"category_id" uuid NOT NULL,
	"supplier_id" uuid,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_method" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"supplier_id" uuid,
	"qty_received" numeric(10, 2) NOT NULL,
	"qty_remaining" numeric(10, 2) NOT NULL,
	"unit_cost_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"qty_delta" numeric(10, 2) NOT NULL,
	"unit_cost_cents" integer NOT NULL,
	"movement_type" "movement_type" NOT NULL,
	"ref_table" text,
	"ref_id" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"category" text NOT NULL,
	"variant" text,
	"supplier_id" uuid,
	"stock_mode" "stock_mode" NOT NULL,
	"unit_label" text NOT NULL,
	"sell_price_cents" integer NOT NULL,
	"reorder_level" numeric(10, 2),
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"gauge_mm" numeric(4, 2),
	"colour" text,
	"material" text,
	"reel_length_m" numeric(6, 1),
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "racket_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "racket_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series_id" uuid NOT NULL,
	"model" text NOT NULL,
	"generation_year" integer,
	"head_size_sqin" numeric(6, 2),
	"string_pattern" text,
	"unstrung_weight_g" integer,
	"notes" text,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "racket_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"line_type" "sale_line_type" NOT NULL,
	"product_id" uuid,
	"string_job_id" uuid,
	"description" text NOT NULL,
	"qty" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"line_total_cents" integer NOT NULL,
	"cogs_cents" integer DEFAULT 0 NOT NULL,
	"revenue_category" text NOT NULL,
	CONSTRAINT "sale_items_string_job_id_unique" UNIQUE("string_job_id")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"customer_id" uuid,
	"subtotal_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'paid' NOT NULL,
	"reverses_sale_id" uuid,
	"notes" text,
	CONSTRAINT "sales_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "string_job_strings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"string_job_id" uuid NOT NULL,
	"role" "string_role" NOT NULL,
	"product_id" uuid NOT NULL,
	"batch_id" uuid,
	"length_used_m" numeric(6, 2) NOT NULL,
	"tension" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "string_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"customer_racket_id" uuid NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"collected_at" timestamp with time zone,
	"status" "job_status" DEFAULT 'received' NOT NULL,
	"tension_unit" "tension_unit" DEFAULT 'kg' NOT NULL,
	"pre_stretch_pct" numeric(5, 2),
	"customer_supplied_string" boolean DEFAULT false NOT NULL,
	"labour_charge_cents" integer NOT NULL,
	"additional_charges_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"racket_label" text NOT NULL,
	"customer_name" text NOT NULL,
	CONSTRAINT "string_jobs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "customer_rackets" ADD CONSTRAINT "customer_rackets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_rackets" ADD CONSTRAINT "customer_rackets_racket_model_id_racket_models_id_fk" FOREIGN KEY ("racket_model_id") REFERENCES "public"."racket_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_models" ADD CONSTRAINT "racket_models_series_id_racket_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."racket_series"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "racket_series" ADD CONSTRAINT "racket_series_brand_id_racket_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."racket_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD CONSTRAINT "string_job_strings_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD CONSTRAINT "string_job_strings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD CONSTRAINT "string_job_strings_batch_id_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD CONSTRAINT "string_jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD CONSTRAINT "string_jobs_customer_racket_id_customer_rackets_id_fk" FOREIGN KEY ("customer_racket_id") REFERENCES "public"."customer_rackets"("id") ON DELETE no action ON UPDATE no action;