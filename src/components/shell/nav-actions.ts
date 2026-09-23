"use server";

import { getJobStats } from "@/lib/jobs";

/** Backs the sidebar's live "String jobs" count badge — kept separate from
 * src/app/jobs/actions.ts since this is a shell concern (every page, not
 * just the Jobs feature), same reasoning as search-actions.ts. */
export async function fetchActiveJobsCount(): Promise<number> {
  const stats = await getJobStats();
  return stats.activeJobs;
}
