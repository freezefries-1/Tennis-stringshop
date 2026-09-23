import { listProducts } from "@/lib/products";
import { listSuppliers } from "@/lib/string-inventory";
import { ReceiveProductStockForm } from "@/components/products/receive-stock-form";

export const dynamic = "force-dynamic";

export default async function ReceiveProductStockPage({ searchParams }: { searchParams: Promise<{ productId?: string }> }) {
  const { productId } = await searchParams;
  const [products, suppliers] = await Promise.all([listProducts({ includeArchived: false }), listSuppliers()]);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Receive stock</h2>
      <ReceiveProductStockForm products={products} suppliers={suppliers} initialProductId={productId} />
    </div>
  );
}
