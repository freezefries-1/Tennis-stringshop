CREATE TYPE "public"."job_payment_status" AS ENUM('unpaid', 'partially_paid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."pre_stretch_type" AS ENUM('none', 'manual', 'machine');--> statement-breakpoint
CREATE TYPE "public"."string_setup_type" AS ENUM('full', 'hybrid');--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'cancelled';--> statement-breakpoint
CREATE SEQUENCE "public"."job_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "string_job_strings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "string_job_strings" CASCADE;--> statement-breakpoint
ALTER TABLE "string_jobs" DROP CONSTRAINT "string_jobs_code_unique";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP CONSTRAINT "string_jobs_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "string_jobs" DROP CONSTRAINT "string_jobs_customer_racket_id_customer_rackets_id_fk";
--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "customer_id";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "customer_racket_id";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "received_at";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "due_at";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "completed_at";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "collected_at";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "tension_unit";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "pre_stretch_pct";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "customer_supplied_string";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "labour_charge_cents";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "additional_charges_cents";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "racket_label";--> statement-breakpoint
ALTER TABLE "string_jobs" DROP COLUMN "customer_name";