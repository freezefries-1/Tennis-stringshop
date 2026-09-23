import { ensureDefaultExpenseCategories, listExpenseCategories, listVendorsInUse } from "@/lib/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  await ensureDefaultExpenseCategories();
  const [categories, vendors] = await Promise.all([listExpenseCategories(false), listVendorsInUse()]);
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Add expense</h2>
      <ExpenseForm mode="create" categories={categories} vendors={vendors} />
    </div>
  );
}
