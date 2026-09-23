import { ensureDefaultCategories, listProductCategories } from "@/lib/products";
import { listSuppliers } from "@/lib/string-inventory";
import { ProductForm } from "@/components/products/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await ensureDefaultCategories();
  const [categories, suppliers] = await Promise.all([listProductCategories(false), listSuppliers()]);
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Add product</h2>
      <ProductForm mode="create" categories={categories} suppliers={suppliers} />
    </div>
  );
}
