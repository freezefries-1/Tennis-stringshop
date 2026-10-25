import { getTopCustomers, getCustomerAnalyticsSummary } from "@/lib/reports-customers";
import { getInventoryValueOverview } from "@/lib/reports-inventory";
import { getPopularStrings } from "@/lib/reports-stringing";
import type { FinancialsFilters } from "@/lib/financials";
import { TopCustomers, CustomerInsights, InventoryValueCard, PopularStrings } from "./dashboard";

// Its own async Server Component with its own (smaller) Promise.all, wrapped
// in its own <Suspense> in app/dashboard/page.tsx — kept OUT of that page's
// main Promise.all so these 4 cards' ~12 DB round trips stream in after the
// rest of the dashboard has already shipped, instead of piling onto the
// same request/connection burst. See that page's comment for the incident
// this fixed.
export async function CustomersInventorySection({ filters }: { filters: FinancialsFilters }) {
  const [topCustomers, customerInsights, inventoryValue, popularStrings] = await Promise.all([
    getTopCustomers(filters, 5),
    getCustomerAnalyticsSummary(filters),
    getInventoryValueOverview(),
    getPopularStrings(filters, 5),
  ]);

  return (
    <>
      <div className="g2">
        <TopCustomers customers={topCustomers} />
        <CustomerInsights summary={customerInsights} />
      </div>
      <div className="g2">
        <InventoryValueCard overview={inventoryValue} />
        <PopularStrings rows={popularStrings} />
      </div>
    </>
  );
}
