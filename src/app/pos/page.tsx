import { getCustomer } from "@/lib/customers";
import { PosView } from "@/components/pos/pos-view";

export const dynamic = "force-dynamic";

export default async function PosPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const { customerId } = await searchParams;
  const customer = customerId ? await getCustomer(customerId) : null;
  const initialCustomer = customer ? { id: customer.id, code: customer.code, name: customer.name, phone: customer.phone } : null;

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">New sale</h2>
      <PosView initialCustomer={initialCustomer} />
    </div>
  );
}
