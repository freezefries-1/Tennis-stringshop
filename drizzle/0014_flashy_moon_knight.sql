CREATE TYPE "public"."other_income_status" AS ENUM('recorded', 'voided');--> statement-breakpoint
CREATE SEQUENCE "public"."other_income_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "other_income" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"income_number" text DEFAULT 'I' || lpad(nextval('other_income_code_seq')::text, 4, '0') NOT NULL,
	"income_date" date NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"source" text,
	"amount_cents" integer NOT NULL,
	"payment_method" text,
	"reference_number" text,
	"notes" text,
	"status" "other_income_status" DEFAULT 'recorded' NOT NULL,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "other_income_income_number_unique" UNIQUE("income_number")
);
--> statement-breakpoint
CREATE TABLE "other_income_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"other_income_id" uuid NOT NULL,
	"action" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "other_income_audit_log" ADD CONSTRAINT "other_income_audit_log_other_income_id_other_income_id_fk" FOREIGN KEY ("other_income_id") REFERENCES "public"."other_income"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "other_income" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "other_income_audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "other_income_income_date_idx" ON "other_income" USING btree ("income_date");--> statement-breakpoint
CREATE INDEX "other_income_status_idx" ON "other_income" USING btree ("status");