"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { formatCents, formatDate } from "@/lib/format";
import type { SaleListRow } from "@/lib/sales";
import { SALE_PAYMENT_STATUS_LABEL, SALE_PAYMENT_STATUS_TONE, SALE_STATUS_LABEL, SALE_STATUS_TONE } from "./sale-status";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

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

/** [start, end) in the browser's local time — end is exclusive, so a plain
 * `occurredAt >= start && occurredAt < end` check handles every case
 * without off-by-one boundary bugs. Both null means no filtering (All time,
 * or Custom range with neither date filled in yet). */
function dateFilterRange(filter: DateFilter, customFrom: string, customTo: string): [Date | null, Date | null] {
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
      const start = customFrom ? new Date(customFrom) : null;
      const end = customTo ? new Date(new Date(customTo).getTime() + 24 * 60 * 60 * 1000) : null;
      return [start, end];
    }
    default:
      return [null, null];
  }
}

export function SalesView({ sales }: { sales: SaleListRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [status, setStatus] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [rangeStart, rangeEnd] = useMemo(() => dateFilterRange(dateFilter, customFrom, customTo), [dateFilter, customFrom, customTo]);

  const filtered = useMemo(() => {
    const s = normalize(q);
    return sales.filter((sale) => {
      if (paymentStatus && sale.paymentStatus !== paymentStatus) return false;
      if (status && sale.status !== status) return false;
      const occurred = new Date(sale.occurredAt);
      if (rangeStart && occurred < rangeStart) return false;
      if (rangeEnd && occurred >= rangeEnd) return false;
      if (!s) return true;
      const haystack = [sale.code, sale.customerName, sale.stringJobCode, sale.itemSummary].filter(Boolean).join(" ");
      return normalize(haystack).includes(s);
    });
  }, [sales, q, paymentStatus, status, rangeStart, rangeEnd]);

  const goTo = (id: string) => router.push(`/sales/${id}`);

  return (
    <div className="rec-wrap">
      <div className="rec-tools">
        <Input iconLeft="search" placeholder="Search sale number, customer, job or item" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle()}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partially refunded</option>
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={selectStyle()}>
          <option value="">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} style={selectStyle()}>
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
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ width: "100%", minWidth: 0 }} />
          </Field>
          <Field label="To" style={{ width: 160, minWidth: 0 }}>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ width: "100%", minWidth: 0 }} />
          </Field>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <Card>
          <div className="rec-empty">{sales.length === 0 ? "No sales yet. Ring up the first one from POS." : "No match for the current search/filters."}</div>
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
                  {filtered.map((s) => (
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
            {filtered.map((s) => (
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

      {sales.length > 0 ? (
        <div className="row-s">
          {filtered.length} of {sales.length} sale{sales.length === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
