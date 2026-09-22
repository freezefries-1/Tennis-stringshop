import { notFound } from "next/navigation";
import { getStringProduct } from "@/lib/string-inventory";
import { ProductForm } from "@/components/inventory/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getStringProduct(id);
  if (!product) notFound();

  return (
    <div className="ph-wrap" style={{ maxWidth: 720 }}>
      <h2 className="ph-title">
        Edit {product.brand} {product.name}
      </h2>
      <div style={{ marginTop: 16 }}>
        <ProductForm mode="edit" product={product} />
      </div>
    </div>
  );
}
