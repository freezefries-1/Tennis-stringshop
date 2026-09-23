import { ensureDefaultExpenseCategories, listExpenseCategories } from "@/lib/expenses";
import { RecurringForm } from "@/components/expenses/recurring-form";

export const dynamic = "force-dynamic";

export default async function NewRecurringExpensePage() {
  await ensureDefaultExpenseCategories();
  const categories = await listExpenseCategories(false);
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Add recurring expense</h2>
      <RecurringForm mode="create" categories={categories} />
    </div>
  );
}
