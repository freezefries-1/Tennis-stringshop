import { listProducts, listProductCategories, ensureDefaultCategories } from "@/lib/products";
import { ProductsView } from "@/components/products/products-view";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await ensureDefaultCategories();
  const [products, categories] = await Promise.all([listProducts({ includeArchived: true }), listProductCategories(true)]);
  return <ProductsView products={products} categories={categories} />;
}
