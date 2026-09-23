"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
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

export function SalesView({ sales }: { sales: SaleListRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const s = normalize(q);
    return sales.filter((sale) => {
      if (paymentStatus && sale.paymentStatus !== paymentStatus) return false;
      if (status && sale.status !== status) return false;
      if (!s) return true;
      const haystack = [sale.code, sale.customerName, sale.stringJobCode, sale.itemSummary].filter(Boolean).join(" ");
      return normalize(haystack).includes(s);
    });
  }, [sales, q, paymentStatus, status]);

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
      </div>

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
