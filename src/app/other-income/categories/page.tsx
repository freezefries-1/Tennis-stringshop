import { listCategoriesWithCounts } from "@/lib/other-income";
import { OtherIncomeCategoryManager } from "@/components/other-income/category-manager";

export const dynamic = "force-dynamic";

export default async function OtherIncomeCategoriesPage() {
  const categories = await listCategoriesWithCounts();
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Other income categories</h2>
      <p className="row-s" style={{ marginBottom: 16 }}>
        Rename a category and every record using it — voided ones included — updates to match. Renaming to a name that already exists merges the two.
      </p>
      <OtherIncomeCategoryManager categories={categories} />
    </div>
  );
}
