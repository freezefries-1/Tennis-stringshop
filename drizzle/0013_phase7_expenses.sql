CREATE TYPE "public"."expense_status" AS ENUM('recorded', 'voided');--> statement-breakpoint
CREATE TYPE "public"."expense_treatment" AS ENUM('operating', 'capital');--> statement-breakpoint
CREATE TYPE "public"."recurring_frequency" AS ENUM('weekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE SEQUENCE "public"."expense_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "expense_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expense_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_number" text DEFAULT 'E' || lpad(nextval('expense_code_seq')::text, 4, '0') NOT NULL,
	"expense_date" date NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"vendor" text,
	"amount_cents" integer NOT NULL,
	"payment_method" text,
	"reference_number" text,
	"receipt_url" text,
	"notes" text,
	"recurring_expense_id" uuid,
	"treatment" "expense_treatment" DEFAULT 'operating' NOT NULL,
	"status" "expense_status" DEFAULT 'recorded' NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_expense_number_unique" UNIQUE("expense_number")
);
--> statement-breakpoint
CREATE TABLE "recurring_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"vendor" text,
	"amount_cents" integer NOT NULL,
	"frequency" "recurring_frequency" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_due_date" date NOT NULL,
	"payment_method" text,
	"notes" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_audit_log" ADD CONSTRAINT "expense_audit_log_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_expense_id_recurring_expenses_id_fk" FOREIGN KEY ("recurring_expense_id") REFERENCES "public"."recurring_expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "recurring_expenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "expenses_expense_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expenses_category_id_idx" ON "expenses" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recurring_expenses_active_idx" ON "recurring_expenses" USING btree ("active");--> statement-breakpoint
CREATE INDEX "recurring_expenses_next_due_date_idx" ON "recurring_expenses" USING btree ("next_due_date");--> statement-breakpoint
-- Phase 7 financial reporting scans sales/sale_items by date range and
-- status heavily (src/lib/financials.ts) — these two tables predate any
-- indexing in this schema, so add the ones the brief calls out (§52)
-- rather than leaving every financial query as a full table scan.
CREATE INDEX IF NOT EXISTS "sales_occurred_at_idx" ON "sales" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sales_customer_id_idx" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sales_status_idx" ON "sales" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sales_payment_status_idx" ON "sales" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sale_items_sale_id_idx" ON "sale_items" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sale_items_item_type_idx" ON "sale_items" USING btree ("item_type");