import { listSalesPage, getSalesSummary, type SalesFilters, type SaleStatus, type SalePaymentStatus } from "@/lib/sales";
import { SalesView } from "@/components/sales/sales-view";

export const dynamic = "force-dynamic";

const PAGE_SIZES = [25, 50];
const DEFAULT_PAGE_SIZE = 25;

interface SalesSearchParams {
  q?: string;
  status?: string;
  paymentStatus?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
}

export default async function SalesPage({ searchParams }: { searchParams: Promise<SalesSearchParams> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = PAGE_SIZES.includes(Number(sp.pageSize)) ? Number(sp.pageSize) : DEFAULT_PAGE_SIZE;

  // from/to arrive as full ISO instants (the client resolves "this month"
  // etc. in local time and serializes the exact boundary via
  // toISOString()) so this parse is unambiguous regardless of where the
  // server itself happens to run.
  const filters: SalesFilters = {
    dateFrom: sp.from ? new Date(sp.from) : null,
    dateTo: sp.to ? new Date(sp.to) : null,
    search: sp.q ?? null,
    status: (sp.status as SaleStatus) || null,
    paymentStatus: (sp.paymentStatus as SalePaymentStatus) || null,
  };

  const [{ rows, totalCount }, summary] = await Promise.all([listSalesPage({ ...filters, page, pageSize }), getSalesSummary(filters)]);

  return (
    <SalesView
      sales={rows}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      summary={summary}
      initialQuery={sp.q ?? ""}
      initialStatus={sp.status ?? ""}
      initialPaymentStatus={sp.paymentStatus ?? ""}
      initialFrom={sp.from ?? ""}
      initialTo={sp.to ?? ""}
    />
  );
}
