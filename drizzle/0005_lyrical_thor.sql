CREATE TABLE "string_job_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"string_job_id" uuid NOT NULL,
	"service_name" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "string_job_strings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"string_job_id" uuid NOT NULL,
	"role" "string_role" NOT NULL,
	"string_product_id" uuid,
	"customer_supplied" boolean DEFAULT false NOT NULL,
	"brand_snapshot" text NOT NULL,
	"string_name_snapshot" text NOT NULL,
	"gauge_snapshot" numeric(3, 2),
	"colour_snapshot" text,
	"tension" numeric(5, 2) NOT NULL,
	"tension_unit" "tension_unit" DEFAULT 'lb' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "code" text DEFAULT 'J' || lpad(nextval('job_code_seq')::text, 4, '0') NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "customer_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "customer_racket_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "setup_type" "string_setup_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "status" "job_status" DEFAULT 'received' NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "received_on" date NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "due_on" date;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "collected_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "number_of_knots" integer;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "pre_stretch_type" "pre_stretch_type" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "pre_stretch_pct" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "payment_status" "job_payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "discount_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "final_price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "general_notes" text;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "stringing_notes" text;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "racket_label" text NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "customer_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "string_job_services" ADD CONSTRAINT "string_job_services_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD CONSTRAINT "string_job_strings_string_job_id_string_jobs_id_fk" FOREIGN KEY ("string_job_id") REFERENCES "public"."string_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_job_strings" ADD CONSTRAINT "string_job_strings_string_product_id_products_id_fk" FOREIGN KEY ("string_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD CONSTRAINT "string_jobs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD CONSTRAINT "string_jobs_customer_racket_id_customer_rackets_id_fk" FOREIGN KEY ("customer_racket_id") REFERENCES "public"."customer_rackets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD CONSTRAINT "string_jobs_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "string_job_strings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "string_job_services" ENABLE ROW LEVEL SECURITY;