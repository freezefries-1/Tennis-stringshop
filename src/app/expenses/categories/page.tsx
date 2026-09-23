import { ensureDefaultExpenseCategories, listExpenseCategories } from "@/lib/expenses";
import { CategoryManager } from "@/components/expenses/category-manager";

export const dynamic = "force-dynamic";

export default async function ExpenseCategoriesPage() {
  await ensureDefaultExpenseCategories();
  const categories = await listExpenseCategories(true);
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Expense categories</h2>
      <p className="row-s" style={{ marginBottom: 16 }}>
        Archived categories stay visible on past expenses but won&rsquo;t be offered when recording a new one.
      </p>
      <CategoryManager categories={categories} />
    </div>
  );
}
