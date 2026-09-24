"use server";

import { getJobStats } from "@/lib/jobs";
import { getInventorySummary as getStringInventorySummary } from "@/lib/string-inventory";

/** Backs the sidebar's live "String jobs" count badge — kept separate from
 * src/app/jobs/actions.ts since this is a shell concern (every page, not
 * just the Jobs feature), same reasoning as search-actions.ts. */
export async function fetchActiveJobsCount(): Promise<number> {
  const stats = await getJobStats();
  return stats.activeJobs;
}

/** Backs the sidebar's "Inventory" count badge — the nav item links to
 * /inventory specifically (STRING inventory; "Products" is the separate
 * retail catalogue with its own page), so this counts only string low +
 * out of stock, reusing the exact getInventorySummary() /inventory's own
 * "Low stock" stat calls — the two can never disagree. Replaces the old
 * hardcoded seed-data "4". */
export async function fetchLowStockCount(): Promise<number> {
  const summary = await getStringInventorySummary();
  return summary.lowStockCount + summary.outOfStockCount;
}
