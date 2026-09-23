import { listRecurringExpenses } from "@/lib/recurring-expenses";
import { RecurringView } from "@/components/expenses/recurring-view";

export const dynamic = "force-dynamic";

export default async function RecurringExpensesPage() {
  const recurring = await listRecurringExpenses(true);
  return (
    <div className="ph-wrap">
      <h2 className="ph-title">Recurring expenses</h2>
      <RecurringView recurring={recurring} />
    </div>
  );
}
