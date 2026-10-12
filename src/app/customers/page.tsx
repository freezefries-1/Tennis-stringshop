import { listCustomers } from "@/lib/customers";
import { CustomersView } from "@/components/customers/customers-view";

// Always fresh — a live customer list must never be served from a stale
// build-time snapshot.
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  // Always fetch archived customers too — CustomersView hides them behind
  // a "Show archived" checkbox (defaulting off) rather than a server round
  // trip, the same client-side-filter pattern the racket tab on a customer
  // profile uses, so an archived customer stays findable/unarchivable.
  const customers = await listCustomers(true);
  return <CustomersView customers={customers} />;
}
