CREATE TABLE "stringing_machines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"clean_interval_jobs" integer DEFAULT 50 NOT NULL,
	"last_cleaned_at" timestamp with time zone,
	"notes" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "string_jobs" ADD COLUMN "machine_id" uuid;--> statement-breakpoint
ALTER TABLE "string_jobs" ADD CONSTRAINT "string_jobs_machine_id_stringing_machines_id_fk" FOREIGN KEY ("machine_id") REFERENCES "public"."stringing_machines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stringing_machines" ENABLE ROW LEVEL SECURITY;