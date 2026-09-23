ALTER TYPE "public"."string_movement_type" ADD VALUE 'retail_sale' BEFORE 'manual_add';--> statement-breakpoint
CREATE TABLE "sale_item_string_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_item_id" uuid NOT NULL,
	"inventory_batch_id" uuid NOT NULL,
	"quantity_used" numeric(10, 2) NOT NULL,
	"cost_per_unit_snapshot" numeric(12, 4) NOT NULL,
	"cogs_amount_cents" integer NOT NULL,
	"movement_id" uuid,
	"reversed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD COLUMN "sale_id" uuid;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD COLUMN "sale_item_id" uuid;--> statement-breakpoint
ALTER TABLE "sale_item_string_allocations" ADD CONSTRAINT "sale_item_string_allocations_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_string_allocations" ADD CONSTRAINT "sale_item_string_allocations_inventory_batch_id_string_inventory_batches_id_fk" FOREIGN KEY ("inventory_batch_id") REFERENCES "public"."string_inventory_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_string_allocations" ADD CONSTRAINT "sale_item_string_allocations_movement_id_string_inventory_movements_id_fk" FOREIGN KEY ("movement_id") REFERENCES "public"."string_inventory_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD CONSTRAINT "string_inventory_movements_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_inventory_movements" ADD CONSTRAINT "string_inventory_movements_sale_item_id_sale_items_id_fk" FOREIGN KEY ("sale_item_id") REFERENCES "public"."sale_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_item_string_allocations" ENABLE ROW LEVEL SECURITY;