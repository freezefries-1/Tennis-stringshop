"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { StatBlock } from "@/components/ds/stat-block";
import { formatCents, formatDate } from "@/lib/format";
import type { OtherIncome } from "@/lib/other-income";
import { OTHER_INCOME_STATUS_LABEL, OTHER_INCOME_STATUS_TONE } from "./other-income-status";
import { DATE_FILTER_LABEL, presetRange, detectPreset, toLocalDateInputValue, type DateFilterPreset } from "@/lib/date-filter";
import { ExportOtherIncomeCsvButton } from "./export-other-income-csv-button";

function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

const PAGE_SIZES = [25, 50];

export function OtherIncomeView({
  rows,
  totalCount,
  page,
  pageSize,
  totalCents,
  initialQuery,
  initialStatus,
  initialFrom,
  initialTo,
}: {
  rows: OtherIncome[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalCents: number;
  initialQuery: string;
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

  function pushFilters(overrides: { q?: string; status?: string; dateFilter?: DateFilterPreset; customFrom?: string; customTo?: string; page?: number; pageSize?: number }) {
    const nextQ = overrides.q ?? q;
    const nextStatus = overrides.status ?? initialStatus;
    const nextDateFilter = overrides.dateFilter ?? dateFilter;
    const nextCustomFrom = overrides.customFrom ?? customFrom;
    const nextCustomTo = overrides.customTo ?? customTo;
    const nextPage = overrides.page ?? page;
    const nextPageSize = overrides.pageSize ?? pageSize;

    const [start, end] = presetRange(nextDateFilter, nextCustomFrom, nextCustomTo);
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (start) params.set("from", start.toISOString());
    if (end) params.set("to", end.toISOString());
    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));
    router.push(`/other-income?${params.toString()}`);
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
  const goTo = (id: string) => router.push(`/other-income/${id}`);

  const [exportRangeStart, exportRangeEnd] = presetRange(dateFilter, customFrom, customTo);
  const exportFilters = {
    dateFrom: exportRangeStart ? toDateStr(exportRangeStart) : null,
    dateTo: exportRangeEnd ? toDateStr(exportRangeEnd) : null,
    search: q || null,
    status: (initialStatus || null) as "recorded" | "voided" | null,
  };

  return (
    <div className="rec-wrap">
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
        <Link href="/other-income/new">
          <Button size="sm" iconLeft="plus">
            Add income
          </Button>
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Card>
          <StatBlock label="Other income" value={formatCents(totalCents)} icon="banknote" />
        </Card>
        <Card>
          <StatBlock label="Number of records" value={totalCount} icon="receipt" />
        </Card>
      </div>

      <div className="rec-tools" style={{ flexWrap: "wrap" }}>
        <Input iconLeft="search" placeholder="Search number, description, source, category, reference" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
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

      {rows.length === 0 ? (
        <Card>
          <div className="rec-empty">{totalCount === 0 ? "No other income recorded yet." : "No records on this page."}</div>
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
                    <th>Source</th>
                    <th>Status</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => goTo(r.id)} tabIndex={0} onKeyDown={(ev) => ev.key === "Enter" && goTo(r.id)}>
                      <td className="num">{r.incomeNumber}</td>
                      <td className="num">{formatDate(r.incomeDate)}</td>
                      <td>{r.description}</td>
                      <td>{r.category}</td>
                      <td>{r.source ?? "—"}</td>
                      <td>
                        <Badge tone={OTHER_INCOME_STATUS_TONE[r.status]} dot>
                          {OTHER_INCOME_STATUS_LABEL[r.status]}
                        </Badge>
                      </td>
                      <td className="num">{formatCents(r.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {rows.map((r) => (
              <Card key={r.id} interactive onClick={() => goTo(r.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">{r.description}</span>
                  <span className="row-s num">{r.incomeNumber}</span>
                </div>
                <div className="ccard-meta">
                  <span className="row-s">
                    {r.category}
                    {r.source ? ` · ${r.source}` : ""}
                  </span>
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Date</span>
                    <span className="num">{formatDate(r.incomeDate)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Amount</span>
                    <span className="num">{formatCents(r.amountCents)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Status</span>
                    <Badge tone={OTHER_INCOME_STATUS_TONE[r.status]} dot>
                      {OTHER_INCOME_STATUS_LABEL[r.status]}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div className="row-s">{totalCount === 0 ? "0 records" : `${rangeStart}–${rangeEnd} of ${totalCount} record${totalCount === 1 ? "" : "s"}`}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <ExportOtherIncomeCsvButton filters={exportFilters} />
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
