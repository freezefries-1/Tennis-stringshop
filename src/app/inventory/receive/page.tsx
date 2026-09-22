import { listStringProducts, listSuppliers } from "@/lib/string-inventory";
import { ReceiveStockForm } from "@/components/inventory/receive-stock-form";

export const dynamic = "force-dynamic";

export default async function ReceiveStockPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const productId = typeof sp.productId === "string" ? sp.productId : undefined;
  const [products, suppliers] = await Promise.all([listStringProducts({ includeArchived: false }), listSuppliers()]);

  return (
    <div className="ph-wrap" style={{ maxWidth: 720 }}>
      <h2 className="ph-title">Receive stock</h2>
      <div style={{ marginTop: 16 }}>
        <ReceiveStockForm products={products} suppliers={suppliers} initialProductId={productId} />
      </div>
    </div>
  );
}
