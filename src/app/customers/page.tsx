import { listCustomers } from "@/lib/customers";
import { CustomersView } from "@/components/customers/customers-view";

// Always fresh — a live customer list must never be served from a stale
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await listCustomers();
  return <CustomersView customers={customers} />;
}
