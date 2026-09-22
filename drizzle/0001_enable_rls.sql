-- Enable Row Level Security on every table, with no policies defined.
-- This app never queries through Supabase's PostgREST/anon-key API (it
-- connects directly to Postgres as the superuser, which always bypasses
-- RLS — see src/db/client.ts), so this has zero effect on the app itself.
-- What it does do: close off the public REST API Supabase exposes by
-- default for every table, so a leaked/guessed anon key can't read or
-- write customer data. See AGENTS.md.
ALTER TABLE "customer_rackets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "racket_brands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "racket_models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "racket_series" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "string_job_strings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "string_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
