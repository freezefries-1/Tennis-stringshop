import { getJobStats, listJobs } from "@/lib/jobs";
import { JobsView } from "@/components/jobs/jobs-view";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobs, stats] = await Promise.all([listJobs(), getJobStats()]);
  return <JobsView jobs={jobs} stats={stats} />;
}
