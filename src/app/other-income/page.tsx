import { listOtherIncomePage, getOtherIncomeTotalCents, type OtherIncomeFilters, type OtherIncomeStatus } from "@/lib/other-income";
import { OtherIncomeView } from "@/components/other-income/other-income-view";

export const dynamic = "force-dynamic";

const PAGE_SIZES = [25, 50];
const DEFAULT_PAGE_SIZE = 25;

interface OtherIncomeSearchParams {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
}

export default async function OtherIncomePage({ searchParams }: { searchParams: Promise<OtherIncomeSearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = PAGE_SIZES.includes(Number(sp.pageSize)) ? Number(sp.pageSize) : DEFAULT_PAGE_SIZE;

  const toDateStr = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const filters: OtherIncomeFilters = {
    dateFrom: sp.from ? toDateStr(sp.from) : null,
    dateTo: sp.to ? toDateStr(sp.to) : null,
    search: sp.q ?? null,
    status: (sp.status as OtherIncomeStatus) || null,
  };

  const [{ rows, totalCount }, totalCents] = await Promise.all([listOtherIncomePage({ ...filters, page, pageSize }), getOtherIncomeTotalCents(filters)]);

  return (
    <OtherIncomeView
      rows={rows}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      totalCents={totalCents}
      initialQuery={sp.q ?? ""}
      initialStatus={sp.status ?? ""}
      initialFrom={sp.from ?? ""}
      initialTo={sp.to ?? ""}
    />
  );
}
