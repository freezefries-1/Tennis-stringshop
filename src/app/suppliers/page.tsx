import { listSuppliers } from "@/lib/string-inventory";
import { Card } from "@/components/ds/card";
import { SupplierManager } from "@/components/suppliers/supplier-manager";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await listSuppliers(true);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Suppliers</h2>
      <p className="row-s" style={{ marginTop: 4, marginBottom: 16 }}>
        Shared between string inventory and products — rename, archive or delete. Archiving keeps a supplier on its existing batches but hides it from the picker when receiving new stock; deleting is only possible while it has never actually been used.
      </p>
      <Card padding="20px" style={{ maxWidth: 480 }}>
        <SupplierManager initialSuppliers={suppliers} />
      </Card>
    </div>
  );
}
