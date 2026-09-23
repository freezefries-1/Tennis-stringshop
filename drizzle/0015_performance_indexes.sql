-- Performance pass (production 504 diagnosis) — every one of these tables
-- had ZERO indexes before this migration; every query below was doing a
-- full sequential scan regardless of row count. Small today, but this is
-- exactly the kind of debt that turns into a real production timeout as
-- transaction/movement history grows — see the dashboard timeout report
-- for the specific queries each index targets.

-- string_jobs — getJobStats' status-count queries (/jobs, and indirectly
-- referenced work), plus customer/racket profile history lookups.
CREATE INDEX IF NOT EXISTS "string_jobs_customer_id_idx" ON "string_jobs" USING btree ("customer_id");
CREATE INDEX IF NOT EXISTS "string_jobs_customer_racket_id_idx" ON "string_jobs" USING btree ("customer_racket_id");
CREATE INDEX IF NOT EXISTS "string_jobs_status_idx" ON "string_jobs" USING btree ("status");
CREATE INDEX IF NOT EXISTS "string_jobs_completed_at_idx" ON "string_jobs" USING btree ("completed_at");
CREATE INDEX IF NOT EXISTS "string_jobs_due_on_idx" ON "string_jobs" USING btree ("due_on");

-- string_inventory_movements — listRecentMovements (dashboard + inventory
-- pages) orders by occurred_at with a LIMIT; without an index that's a
-- full-table sort. string_product_id/batch_id back per-product movement
-- history and FIFO batch lookups.
CREATE INDEX IF NOT EXISTS "string_inventory_movements_occurred_at_idx" ON "string_inventory_movements" USING btree ("occurred_at");
CREATE INDEX IF NOT EXISTS "string_inventory_movements_string_product_id_idx" ON "string_inventory_movements" USING btree ("string_product_id");
CREATE INDEX IF NOT EXISTS "string_inventory_movements_batch_id_idx" ON "string_inventory_movements" USING btree ("batch_id");

-- string_inventory_batches — FIFO allocation always filters by product +
-- active status, ordered oldest-first.
CREATE INDEX IF NOT EXISTS "string_inventory_batches_string_product_id_idx" ON "string_inventory_batches" USING btree ("string_product_id");
CREATE INDEX IF NOT EXISTS "string_inventory_batches_status_idx" ON "string_inventory_batches" USING btree ("status");

-- product_inventory_movements / product_inventory_batches — the retail
-- equivalent of the two above, same reasoning.
CREATE INDEX IF NOT EXISTS "product_inventory_movements_occurred_at_idx" ON "product_inventory_movements" USING btree ("occurred_at");
CREATE INDEX IF NOT EXISTS "product_inventory_movements_product_id_idx" ON "product_inventory_movements" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "product_inventory_movements_batch_id_idx" ON "product_inventory_movements" USING btree ("batch_id");
CREATE INDEX IF NOT EXISTS "product_inventory_batches_product_id_idx" ON "product_inventory_batches" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "product_inventory_batches_status_idx" ON "product_inventory_batches" USING btree ("status");

-- customers / customer_rackets — the archived filter is on nearly every
-- customer list/search query; customer_rackets.customer_id backs every
-- "this customer's rackets" lookup (profile page, job/sale pickers).
CREATE INDEX IF NOT EXISTS "customers_archived_at_idx" ON "customers" USING btree ("archived_at");
CREATE INDEX IF NOT EXISTS "customer_rackets_customer_id_idx" ON "customer_rackets" USING btree ("customer_id");

-- sale_payments — every paidCents/balanceDue computation joins this
-- against sales.id.
CREATE INDEX IF NOT EXISTS "sale_payments_sale_id_idx" ON "sale_payments" USING btree ("sale_id");
