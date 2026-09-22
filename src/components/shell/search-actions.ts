"use server";

import { and, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { customers } from "@/db/schema";

export interface CustomerSearchHit {
  id: string;
  name: string;
  code: string;
  phone: string;
}

/** Backs the site-wide ⌘K search's "Customers" group — real rows, unlike
 * the other groups (rackets/jobs/products/sales), which are still Phase 1
 * seed data until their own phases land. */
export async function searchCustomers(query: string): Promise<CustomerSearchHit[]> {
  const q = query.trim();
  if (!q) return [];
  const digits = q.replace(/\D/g, "");
  const like = `%${q}%`;

  const rows = await db
    .select({ id: customers.id, name: customers.name, code: customers.code, phone: customers.phone })
    .from(customers)
    .where(
      and(
        isNull(customers.archivedAt),
        digits
          ? sql`(${customers.name} ilike ${like} or ${customers.code} ilike ${like} or regexp_replace(${customers.phone}, '\\D', '', 'g') like ${"%" + digits + "%"})`
          : sql`(${customers.name} ilike ${like} or ${customers.code} ilike ${like})`,
      ),
    )
    .limit(4);

  return rows;
}
