"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Icon } from "@/components/ds/icon";
import { formatCents, formatDate } from "@/lib/format";
import type { ExpenseCategory, ExpenseListRow, ExpenseSummary } from "@/lib/expenses";
import { EXPENSE_STATUS_LABEL, EXPENSE_STATUS_TONE, EXPENSE_TREATMENT_LABEL, EXPENSE_TREATMENT_TONE } from "./expense-status";
import { ExpensesSummary } from "./expenses-summary";
import { DATE_FILTER_LABEL, presetRange, detectPreset, toLocalDateInputValue, type DateFilterPreset } from "@/lib/date-filter";
import { ExportCsvButton } from "./export-csv-button";

function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

const PAGE_SIZES = [25, 50];

export function ExpensesView({
  expenses,
  totalCount,
  page,
  pageSize,
  summary,
  categories,
  initialQuery,
  initialCategoryId,
  initialPaymentMethod,
  initialRecurring,
  initialStatus,
  initialFrom,
  initialTo,
}: {
  expenses: ExpenseListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  summary: ExpenseSummary;
  categories: ExpenseCategory[];
  initialQuery: string;
  initialCategoryId: string;
  initialPaymentMethod: string;
  initialRecurring: string;
  initialStatus: string;
  initialFrom: string;
  initialTo: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const dateFilter = detectPreset(initialFrom, initialTo);
  const [customFrom, setCustomFrom] = useState(() => (dateFilter === "custom" && initialFrom ? toLocalDateInputValue(new Date(initialFrom)) : ""));
  const [customTo, setCustomTo] = useState(() => {
    if (dateFilter !== "custom" || !initialTo) return "";
    const end = new Date(initialTo);
    end.setDate(end.getDate() - 1);
    return toLocalDateInputValue(end);
  });

  function pushFilters(overrides: {
    q?: string;
    categoryId?: string;
    paymentMethod?: string;
    recurring?: string;
    status?: string;
    dateFilter?: DateFilterPreset;
    customFrom?: string;
    customTo?: string;
    page?: number;
    pageSize?: number;
  }) {
    const nextQ = overrides.q ?? q;
    const nextCategoryId = overrides.categoryId ?? initialCategoryId;
    const nextPaymentMethod = overrides.paymentMethod ?? initialPaymentMethod;
    const nextRecurring = overrides.recurring ?? initialRecurring;
    const nextStatus = overrides.status ?? initialStatus;
    const nextDateFilter = overrides.dateFilter ?? dateFilter;
    const nextCustomFrom = overrides.customFrom ?? customFrom;
    const nextCustomTo = overrides.customTo ?? customTo;
    const nextPage = overrides.page ?? page;
    const nextPageSize = overrides.pageSize ?? pageSize;

    const [start, end] = presetRange(nextDateFilter, nextCustomFrom, nextCustomTo);
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextCategoryId) params.set("categoryId", nextCategoryId);
    if (nextPaymentMethod) params.set("paymentMethod", nextPaymentMethod);
    if (nextRecurring) params.set("recurring", nextRecurring);
    if (nextStatus) params.set("status", nextStatus);
    if (start) params.set("from", start.toISOString());
    if (end) params.set("to", end.toISOString());
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`/expenses?${params.toString()}`);
  }

  useEffect(() => {
    if (q === initialQuery) return;
    const timer = setTimeout(() => pushFilters({ q, page: 1 }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, page * pageSize);
  const goTo = (id: string) => router.push(`/expenses/${id}`);

  const [exportRangeStart, exportRangeEnd] = presetRange(dateFilter, customFrom, customTo);
  const exportFilters = {
    dateFrom: exportRangeStart ? toDateStr(exportRangeStart) : null,
    dateTo: exportRangeEnd ? toDateStr(exportRangeEnd) : null,
    search: q || null,
    categoryId: initialCategoryId || null,
    paymentMethod: initialPaymentMethod || null,
    recurringOnly: initialRecurring === "true" ? true : initialRecurring === "false" ? false : null,
    status: (initialStatus || null) as "recorded" | "voided" | null,
  };

  return (
    <div className="rec-wrap">
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <Link href="/expenses/categories">
          <Button size="sm" variant="ghost">
            Manage categories
          </Button>
        </Link>
        <Link href="/expenses/recurring">
          <Button size="sm" variant="ghost">
            Recurring expenses
          </Button>
        </Link>
        <Link href="/expenses/new">
          <Button size="sm" iconLeft="plus">
            Add expense
          </Button>
        </Link>
      </div>

      <ExpensesSummary summary={summary} />

      <div className="rec-tools" style={{ flexWrap: "wrap" }}>
        <Input iconLeft="search" placeholder="Search number, description, vendor, category, reference" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select value={initialCategoryId} onChange={(e) => pushFilters({ categoryId: e.target.value, page: 1 })} style={selectStyle()}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={initialPaymentMethod} onChange={(e) => pushFilters({ paymentMethod: e.target.value, page: 1 })} style={selectStyle()}>
          <option value="">All payment methods</option>
          <option value="PayNow">PayNow</option>
          <option value="Cash">Cash</option>
          <option value="Bank transfer">Bank transfer</option>
          <option value="Card">Card</option>
          <option value="Personal card">Personal card</option>
          <option value="Business card">Business card</option>
          <option value="Other">Other</option>
        </select>
        <select value={initialRecurring} onChange={(e) => pushFilters({ recurring: e.target.value, page: 1 })} style={selectStyle()}>
          <option value="">Recurring & one-off</option>
          <option value="true">Recurring only</option>
          <option value="false">One-off only</option>
        </select>
        <select value={initialStatus} onChange={(e) => pushFilters({ status: e.target.value, page: 1 })} style={selectStyle()}>
          <option value="">Recorded (default)</option>
          <option value="recorded">Recorded</option>
          <option value="voided">Voided</option>
        </select>
        <select value={dateFilter} onChange={(e) => pushFilters({ dateFilter: e.target.value as DateFilterPreset, page: 1 })} style={selectStyle()}>
          {(Object.keys(DATE_FILTER_LABEL) as DateFilterPreset[]).map((f) => (
            <option key={f} value={f}>
              {DATE_FILTER_LABEL[f]}
            </option>
          ))}
        </select>
      </div>

      {dateFilter === "custom" ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="From" style={{ width: 160, minWidth: 0 }}>
            <Input type="date" value={customFrom} onChange={(e) => { setCustomFrom(e.target.value); pushFilters({ customFrom: e.target.value, page: 1 }); }} style={{ width: "100%", minWidth: 0 }} />
          </Field>
          <Field label="To" style={{ width: 160, minWidth: 0 }}>
            <Input type="date" value={customTo} onChange={(e) => { setCustomTo(e.target.value); pushFilters({ customTo: e.target.value, page: 1 }); }} style={{ width: "100%", minWidth: 0 }} />
          </Field>
        </div>
      ) : null}

      {expenses.length === 0 ? (
        <Card>
          <div className="rec-empty">{totalCount === 0 ? "No expenses match these filters." : "No expenses on this page."}</div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th></th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} onClick={() => goTo(e.id)} tabIndex={0} onKeyDown={(ev) => ev.key === "Enter" && goTo(e.id)}>
                      <td className="num">{e.expenseNumber}</td>
                      <td className="num">{formatDate(e.expenseDate)}</td>
                      <td>{e.description}</td>
                      <td>{e.categoryName}</td>
                      <td>{e.vendor ?? "—"}</td>
                      <td>{e.paymentMethod ?? "—"}</td>
                      <td>
                        <Badge tone={EXPENSE_STATUS_TONE[e.status]} dot>
                          {EXPENSE_STATUS_LABEL[e.status]}
                        </Badge>
                      </td>
                      <td>{e.hasReceipt ? <Icon name="receipt" size={15} color="var(--court-600)" /> : null}</td>
                      <td className="num">{formatCents(e.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {expenses.map((e) => (
              <Card key={e.id} interactive onClick={() => goTo(e.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">{e.description}</span>
                  <span className="row-s num">{e.expenseNumber}</span>
                </div>
                <div className="ccard-meta">
                  <span className="row-s">
                    {e.categoryName}
                    {e.vendor ? ` · ${e.vendor}` : ""}
                  </span>
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Date</span>
                    <span className="num">{formatDate(e.expenseDate)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Amount</span>
                    <span className="num">{formatCents(e.amountCents)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Status</span>
                    <Badge tone={EXPENSE_STATUS_TONE[e.status]} dot>
                      {EXPENSE_STATUS_LABEL[e.status]}
                    </Badge>
                  </div>
                  {e.treatment === "capital" ? (
                    <div className="ccard-stat">
                      <span className="lab">Treatment</span>
                      <Badge tone={EXPENSE_TREATMENT_TONE[e.treatment]} dot>
                        {EXPENSE_TREATMENT_LABEL[e.treatment]}
                      </Badge>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div className="row-s">{totalCount === 0 ? "0 expenses" : `${rangeStart}–${rangeEnd} of ${totalCount} expense${totalCount === 1 ? "" : "s"}`}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <ExportCsvButton filters={exportFilters} />
          <Link href="/expenses/import">
            <Button type="button" size="sm" variant="ghost">
              Import CSV
            </Button>
          </Link>
          <select value={pageSize} onChange={(e) => pushFilters({ pageSize: Number(e.target.value), page: 1 })} style={selectStyle()}>
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => pushFilters({ page: page - 1 })}>
            Previous
          </Button>
          <span className="row-s num">
            Page {page} of {totalPages}
          </span>
          <Button type="button" size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => pushFilters({ page: page + 1 })}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
