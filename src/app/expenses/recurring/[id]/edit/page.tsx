import { notFound } from "next/navigation";
import { getRecurringExpense } from "@/lib/recurring-expenses";
import { listExpenseCategories } from "@/lib/expenses";
import { RecurringForm } from "@/components/expenses/recurring-form";

export const dynamic = "force-dynamic";

export default async function EditRecurringExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [recurring, categories] = await Promise.all([getRecurringExpense(id), listExpenseCategories(true)]);
  if (!recurring) notFound();

  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Edit recurring expense</h2>
      <RecurringForm mode="edit" recurring={recurring} categories={categories} />
    </div>
  );
}
