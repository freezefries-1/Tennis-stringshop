import { notFound } from "next/navigation";
import { getProduct, listProductCategories } from "@/lib/products";
import { listSuppliers } from "@/lib/string-inventory";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, suppliers] = await Promise.all([getProduct(id), listProductCategories(false), listSuppliers()]);
  if (!product) notFound();

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Edit product</h2>
      <ProductForm mode="edit" product={product} categories={categories} suppliers={suppliers} />
    </div>
  );
}
