CREATE TABLE "string_pattern_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pattern" text NOT NULL,
	"full_bed_length_m" numeric(6, 2),
	"main_length_m" numeric(6, 2),
	"cross_length_m" numeric(6, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "string_pattern_defaults_pattern_unique" UNIQUE("pattern")
);
--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "recommended_full_bed_length_m" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "recommended_main_length_m" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "recommended_cross_length_m" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "string_pattern_defaults" ENABLE ROW LEVEL SECURITY;