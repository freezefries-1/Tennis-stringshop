"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { formatCents, formatDate } from "@/lib/format";
import type { SaleListRow, SalesSummary as SalesSummaryData } from "@/lib/sales";
import { SALE_PAYMENT_STATUS_LABEL, SALE_PAYMENT_STATUS_TONE, SALE_STATUS_LABEL, SALE_STATUS_TONE } from "./sale-status";
import { SalesSummary } from "./sales-summary";

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

type DateFilter = "all" | "today" | "week" | "month" | "last_month" | "year" | "custom";

const DATE_FILTER_LABEL: Record<DateFilter, string> = {
  all: "All time",
  today: "Today",
  week: "This week",
  month: "This month",
  last_month: "Last month",
  year: "This year",
  custom: "Custom range",
};

const PAGE_SIZES = [25, 50];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseLocalDateInput(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** [start, end) in the browser's local time — end is exclusive, so a plain
 * `occurredAt >= start && occurredAt < end` check handles every case
 * without off-by-one boundary bugs. Both null means no filtering (All
 * time, or Custom range with neither date filled in yet). */
function presetRange(filter: DateFilter, customFrom: string, customTo: string): [Date | null, Date | null] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (filter) {
    case "today": {
      const end = new Date(startOfToday);
      end.setDate(end.getDate() + 1);
      return [startOfToday, end];
    }
    case "week": {
      const day = startOfToday.getDay();
      const start = new Date(startOfToday);
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); // Monday start
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return [start, end];
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return [start, end];
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return [start, end];
    }
    case "year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return [start, end];
    }
    case "custom": {
      const start = parseLocalDateInput(customFrom);
      const toDate = parseLocalDateInput(customTo);
      const end = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1) : null;
      return [start, end];
    }
    default:
      return [null, null];
  }
}

/** Reverse-engineers which preset (if any) the current from/to URL params
 * correspond to, by comparing against what each preset would resolve to
 * right now — so the dropdown's selection is always derived from the
 * actual filter in effect, never a separate piece of state that could
 * drift out of sync with it. */
function detectPreset(fromISO: string, toISO: string): DateFilter {
  if (!fromISO && !toISO) return "all";
  for (const f of ["today", "week", "month", "last_month", "year"] as DateFilter[]) {
    const [s, e] = presetRange(f, "", "");
    if ((s?.toISOString() ?? "") === fromISO && (e?.toISOString() ?? "") === toISO) return f;
  }
  return "custom";
}

export function SalesView({
  sales,
  totalCount,
  page,
  pageSize,
  summary,
  initialQuery,
  initialStatus,
  initialPaymentStatus,
  initialFrom,
  initialTo,
}: {
  sales: SaleListRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  summary: SalesSummaryData;
  initialQuery: string;
  initialStatus: string;
  initialPaymentStatus: string;
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
    end.setDate(end.getDate() - 1); // undo the +1-day exclusive-end encoding
    return toLocalDateInputValue(end);
  });

  // Compares against the URL's own current value (initialQuery) rather than
  // a "skip the first run" ref — a ref-based guard breaks under React Strict
  // Mode's dev-only double effect invocation (and under any navigation that
  // remounts this component), firing a stray push back to page 1 shortly
  // after. Comparing against initialQuery is correct no matter how many
  // times the effect happens to run, since it's a no-op unless the user has
  // actually typed something the URL doesn't already reflect.
  useEffect(() => {
    if (q === initialQuery) return;
    const timer = setTimeout(() => pushFilters({ q, page: 1 }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function pushFilters(overrides: { q?: string; status?: string; paymentStatus?: string; dateFilter?: DateFilter; customFrom?: string; customTo?: string; page?: number; pageSize?: number }) {
    const nextQ = overrides.q ?? q;
    const nextStatus = overrides.status ?? initialStatus;
    const nextPaymentStatus = overrides.paymentStatus ?? initialPaymentStatus;
    const nextDateFilter = overrides.dateFilter ?? dateFilter;
    const nextCustomFrom = overrides.customFrom ?? customFrom;
    const nextCustomTo = overrides.customTo ?? customTo;
    const nextPage = overrides.page ?? page;
    const nextPageSize = overrides.pageSize ?? pageSize;

    const [start, end] = presetRange(nextDateFilter, nextCustomFrom, nextCustomTo);
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextPaymentStatus) params.set("paymentStatus", nextPaymentStatus);
    if (start) params.set("from", start.toISOString());
    if (end) params.set("to", end.toISOString());
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`/sales?${params.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalCount, page * pageSize);

  const goTo = (id: string) => router.push(`/sales/${id}`);

  return (
    <div className="rec-wrap">
      <SalesSummary summary={summary} />

      <div className="rec-tools">
        <Input iconLeft="search" placeholder="Search sale number, customer, job or item" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select value={initialStatus} onChange={(e) => pushFilters({ status: e.target.value, page: 1 })} style={selectStyle()}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially refunded</option>
        </select>
        <select value={initialPaymentStatus} onChange={(e) => pushFilters({ paymentStatus: e.target.value, page: 1 })} style={selectStyle()}>
          <option value="">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={dateFilter} onChange={(e) => pushFilters({ dateFilter: e.target.value as DateFilter, page: 1 })} style={selectStyle()}>
          {(Object.keys(DATE_FILTER_LABEL) as DateFilter[]).map((f) => (
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

      {sales.length === 0 ? (
        <Card>
          <div className="rec-empty">{totalCount === 0 ? "No sales match these filters." : "No sales on this page."}</div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Sale</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Job</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s.id} onClick={() => goTo(s.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goTo(s.id)}>
                      <td className="num">{s.code}</td>
                      <td className="num">{formatDate(s.occurredAt)}</td>
                      <td>{s.customerName ?? "Walk-in"}</td>
                      <td>{s.itemSummary || "—"}</td>
                      <td className="num">{s.stringJobCode ?? "—"}</td>
                      <td>
                        <Badge tone={SALE_STATUS_TONE[s.status]} dot>
                          {SALE_STATUS_LABEL[s.status]}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={SALE_PAYMENT_STATUS_TONE[s.paymentStatus]} dot>
                          {SALE_PAYMENT_STATUS_LABEL[s.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="num">{formatCents(s.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {sales.map((s) => (
              <Card key={s.id} interactive onClick={() => goTo(s.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">{s.customerName ?? "Walk-in"}</span>
                  <span className="row-s num">{s.code}</span>
                </div>
                <div className="ccard-meta">
                  <span className="row-s">{s.itemSummary || "—"}</span>
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Date</span>
                    <span className="num">{formatDate(s.occurredAt)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Total</span>
                    <span className="num">{formatCents(s.totalCents)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Payment</span>
                    <Badge tone={SALE_PAYMENT_STATUS_TONE[s.paymentStatus]} dot>
                      {SALE_PAYMENT_STATUS_LABEL[s.paymentStatus]}
                    </Badge>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Status</span>
                    <Badge tone={SALE_STATUS_TONE[s.status]} dot>
                      {SALE_STATUS_LABEL[s.status]}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        {/* Deliberately "entries", not "sales" — totalCount is every row
         * currently listed (cancelled sales and return/refund rows included,
         * since those are real, clickable rows you can dig into), while the
         * "Number of sales" stat card above counts primary transactions only
         * (see getSalesSummary). The two numbers can legitimately differ. */}
        <div className="row-s">{totalCount === 0 ? "0 entries" : `${rangeStart}–${rangeEnd} of ${totalCount} entr${totalCount === 1 ? "y" : "ies"}`}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
