import { notFound } from "next/navigation";
import { getExpense, listExpenseCategories, listVendorsInUse } from "@/lib/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const dynamic = "force-dynamic";

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [expense, categories, vendors] = await Promise.all([getExpense(id), listExpenseCategories(true), listVendorsInUse()]);
  if (!expense) notFound();

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Edit expense</h2>
      <ExpenseForm mode="edit" expense={expense} categories={categories} vendors={vendors} />
    </div>
  );
}
