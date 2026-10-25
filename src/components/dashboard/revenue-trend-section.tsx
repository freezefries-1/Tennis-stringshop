import { getMonthlyTrend } from "@/lib/financials";
import { RevenueTrend } from "./dashboard";

// Its own async Server Component (not part of app/dashboard/page.tsx's main
// Promise.all) so Next can stream it in after the rest of the dashboard has
// already shipped — see that page's comment for why this was split out.
export async function RevenueTrendSection() {
  const rows = await getMonthlyTrend(6);
  return <RevenueTrend rows={rows} />;
}
