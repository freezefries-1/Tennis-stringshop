ALTER TABLE "customer_rackets" ADD COLUMN "nickname" text;--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "generation_name" text;--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "string_pattern_mains" integer;--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "string_pattern_crosses" integer;--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "standard_balance_mm" integer;--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "standard_length_in" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "recommended_tension_min_lbs" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "racket_models" ADD COLUMN "recommended_tension_max_lbs" numeric(5, 2);