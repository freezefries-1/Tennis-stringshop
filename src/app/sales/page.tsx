import { listSales } from "@/lib/sales";
import { SalesView } from "@/components/sales/sales-view";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const sales = await listSales();
  return <SalesView sales={sales} />;
}
