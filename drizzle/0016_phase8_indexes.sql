-- Phase 8 (Reports & Analytics) — indexes for the new query patterns
-- Reports introduces. Checked against migrations 0001-0015 first (see
-- AGENTS.md/the 504 report) to avoid duplicating anything already indexed —
-- sale_items already had item_type and sale_id; product_id and
-- string_product_id (the two columns every product/string breakdown report
-- groups or filters by) did not.

-- sale_items.product_id / string_product_id — every Product/String Usage/
-- Category report in Reports groups sale_items by one of these two.
CREATE INDEX IF NOT EXISTS "sale_items_product_id_idx" ON "sale_items" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "sale_items_string_product_id_idx" ON "sale_items" USING btree ("string_product_id");

-- customer_rackets.racket_model_id — Racket Analytics (brand/series/model
-- breakdowns) joins customer_rackets to racket_models on this column.
CREATE INDEX IF NOT EXISTS "customer_rackets_racket_model_id_idx" ON "customer_rackets" USING btree ("racket_model_id");

-- string_job_strings.string_job_id — String Usage/Setup Analytics aggregate
-- this table joined to string_jobs by job id; the FK had no index of its
-- own (customer_rackets_customer_id_idx etc. from migration 0015 covered
-- string_jobs itself, not this child table).
CREATE INDEX IF NOT EXISTS "string_job_strings_string_job_id_idx" ON "string_job_strings" USING btree ("string_job_id");
