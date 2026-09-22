CREATE TYPE "public"."inventory_batch_status" AS ENUM('active', 'depleted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."string_movement_type" AS ENUM('received', 'string_job', 'manual_add', 'manual_deduct', 'wastage', 'correction', 'reversal');--> statement-breakpoint
CREATE TYPE "public"."string_stock_unit" AS ENUM('m', 'set');--> statement-breakpoint
CREATE SEQUENCE "public"."batch_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "string_inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_number" text DEFAULT 'BATCH-' || lpad(nextval('batch_code_seq')::text, 4, '0') NOT NULL,
	"string_product_id" uuid NOT NULL,
	"supplier_id" uuid,
	"purchase_date" date NOT NULL,
	"purchase_cost_cents" integer DEFAULT 0 NOT NULL,
	"original_quantity" numeric(10, 2) NOT NULL,
	"remaining_quantity" numeric(10, 2) NOT NULL,
	"unit" "string_stock_unit" NOT NULL,
	"cost_per_unit_cents" numeric(12, 4) NOT NULL,
	"supplier_reference" text,
	"notes" text,
	"status" "inventory_batch_status" DEFAULT 'active' NOT NULL,
	"is_opening_stock" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "string_inventory_batches_batch_number_unique" UNIQUE("batch_number")
);
--> statement-breakpoint
CREATE TABLE "string_inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"string_product_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"movement_type" "string_movement_type" NOT NULL,
	"quantity_change" numeric(10, 2) NOT NULL,
	"unit" "string_stock_unit" NOT NULL,
	"cost_per_unit_cents_snapshot" numeric(12, 4) NOT NULL,
	"string_job_id" uuid,
	"string_job_role" "string_role",
	"reverses_movement_id" uuid,
	"stock_override" boolean DEFAULT false NOT NULL,
	"reason" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "string_job_inventory_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"string_job_id" uuid NOT NULL,
	"role" "string_role" NOT NULL,
	"inventory_batch_id" uuid NOT NULL,
	"quantity_used" numeric(10, 2) NOT NULL,
	"cost_per_unit_snapshot" numeric(12, 4) NOT NULL,
	"cogs_amount_cents" integer NOT NULL,
	"movement_id" uuid,
	"reversed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "string_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand" text NOT NULL,
	"name" text NOT NULL,
	"gauge" numeric(3, 2),
	"colour" text,
	"material" text,
	"sku" text,
	"tracking_unit" "string_stock_unit" DEFAULT 'm' NOT NULL,
	"default_selling_price_cents" integer,
	"low_stock_threshold" numeric(10, 2),
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "string_job_strings" DROP CONSTRAINT "string_job_strings_string_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD COLUMN "quantity_used" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD COLUMN "usage_unit" "string_stock_unit";--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD COLUMN "stock_override" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "inventory_processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "contact_info" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "string_inventory_batches" ADD CONSTRAINT "string_inventory_batches_string_product_id_string_products_id_fk" FOREIGN KEY ("string_product_id") REFERENCES "public"."string_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_inventory_batches" ADD CONSTRAINT "string_inventory_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD CONSTRAINT "string_inventory_movements_string_product_id_string_products_id_fk" FOREIGN KEY ("string_product_id") REFERENCES "public"."string_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD CONSTRAINT "string_inventory_movements_batch_id_string_inventory_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."string_inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD CONSTRAINT "string_inventory_movements_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_inventory_allocations" ADD CONSTRAINT "string_job_inventory_allocations_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_inventory_allocations" ADD CONSTRAINT "string_job_inventory_allocations_inventory_batch_id_string_inventory_batches_id_fk" FOREIGN KEY ("inventory_batch_id") REFERENCES "public"."string_inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_inventory_allocations" ADD CONSTRAINT "string_job_inventory_allocations_movement_id_string_inventory_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."string_inventory_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD CONSTRAINT "string_job_strings_string_product_id_string_products_id_fk" FOREIGN KEY ("string_product_id") REFERENCES "public"."string_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "string_inventory_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "string_job_inventory_allocations" ENABLE ROW LEVEL SECURITY;