import { ensureDefaultCategories, listProductCategories } from "@/lib/products";
import { Card } from "@/components/ds/card";
import { CategoryManager } from "@/components/products/category-manager";

export const dynamic = "force-dynamic";

export default async function ProductCategoriesPage() {
  await ensureDefaultCategories();
  const categories = await listProductCategories(true);

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Product categories</h2>
      <p className="row-s" style={{ marginTop: 4, marginBottom: 16 }}>
        Manage the categories products can be filed under — add your own alongside the defaults, rename, archive or delete.
      </p>
      <Card padding="20px" style={{ maxWidth: 480 }}>
        <CategoryManager initialCategories={categories} />
      </Card>
    </div>
  );
}
