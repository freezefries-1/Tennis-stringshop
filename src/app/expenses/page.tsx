import { listExpensesPage, getExpenseSummary, ensureDefaultExpenseCategories, listExpenseCategories, type ExpenseFilters, type ExpenseStatus } from "@/lib/expenses";
import { ExpensesView } from "@/components/expenses/expenses-view";

export const dynamic = "force-dynamic";

const PAGE_SIZES = [25, 50];
const DEFAULT_PAGE_SIZE = 25;

interface ExpensesSearchParams {
  q?: string;
  categoryId?: string;
  paymentMethod?: string;
  recurring?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<ExpensesSearchParams> }) {
  await ensureDefaultExpenseCategories();
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = PAGE_SIZES.includes(Number(sp.pageSize)) ? Number(sp.pageSize) : DEFAULT_PAGE_SIZE;

  // from/to arrive as full ISO instants (resolved client-side in local
  // time); expenseDate is a plain DATE column, so derive calendar-day
  // strings from them the same way financials.ts does.
  const toDateStr = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const filters: ExpenseFilters = {
    dateFrom: sp.from ? toDateStr(sp.from) : null,
    dateTo: sp.to ? toDateStr(sp.to) : null,
    search: sp.q ?? null,
    categoryId: sp.categoryId || null,
    paymentMethod: sp.paymentMethod || null,
    recurringOnly: sp.recurring === "true" ? true : sp.recurring === "false" ? false : null,
    status: (sp.status as ExpenseStatus) || null,
  };

  const [{ rows, totalCount }, summary, categories] = await Promise.all([listExpensesPage({ ...filters, page, pageSize }), getExpenseSummary(filters), listExpenseCategories(false)]);

  return (
    <ExpensesView
      expenses={rows}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      summary={summary}
      categories={categories}
      initialQuery={sp.q ?? ""}
      initialCategoryId={sp.categoryId ?? ""}
      initialPaymentMethod={sp.paymentMethod ?? ""}
      initialRecurring={sp.recurring ?? ""}
      initialStatus={sp.status ?? ""}
      initialFrom={sp.from ?? ""}
      initialTo={sp.to ?? ""}
    />
  );
}
