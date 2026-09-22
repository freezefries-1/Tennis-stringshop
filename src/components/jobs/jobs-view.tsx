"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import type { JobListRow, JobStats } from "@/lib/jobs";
import { formatCents, formatDate } from "@/lib/format";
import { JOB_STATUSES, JOB_STATUS_LABEL, JOB_STATUS_TONE } from "./job-status";

function normalize(s: string) {
  return s.trim().toLowerCase();
}
function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

type SortKey = "receivedOn" | "dueOn" | "status" | "price";
type DueFilter = "" | "today" | "overdue" | "none";

function isOverdue(dueOn: string | null, status: JobListRow["status"]): boolean {
  if (!dueOn || status === "collected" || status === "cancelled") return false;
  return new Date(dueOn) < new Date(new Date().toDateString());
}

export function JobsView({ jobs, stats }: { jobs: JobListRow[]; stats: JobStats }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");
  const [due, setDue] = useState<DueFilter>("");
  const [sort, setSort] = useState<SortKey>("receivedOn");

  const filtered = useMemo(() => {
    const s = normalize(q);
    const digits = digitsOnly(q);
    let rows = jobs.filter((j) => {
      if (status && j.status !== status) return false;
      if (paymentStatus && j.paymentStatus !== paymentStatus) return false;
      if (due === "today") {
        if (!j.dueOn || j.dueOn !== new Date().toISOString().slice(0, 10)) return false;
      } else if (due === "overdue") {
        if (!isOverdue(j.dueOn, j.status)) return false;
      } else if (due === "none") {
        if (j.dueOn) return false;
      }
      if (!s) return true;
      const haystack = [j.code, j.customerName, j.customerCode, j.racketCode, j.racketLabel, j.mainString, j.crossString].join(" ");
      if (normalize(haystack).includes(s)) return true;
      if (digits && digitsOnly(j.customerPhone).includes(digits)) return true;
      return false;
    });
    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "dueOn":
          return (a.dueOn ?? "9999").localeCompare(b.dueOn ?? "9999");
        case "status":
          return a.status.localeCompare(b.status);
        case "price":
          return b.finalPriceCents - a.finalPriceCents;
        default:
          return b.receivedOn.localeCompare(a.receivedOn);
      }
    });
    return rows;
  }, [jobs, q, status, paymentStatus, due, sort]);

  const goTo = (id: string) => router.push(`/jobs/${id}`);

  const tensionDisplay = (j: JobListRow) => {
    if (j.mainTension == null && j.crossTension == null) return "—";
    if (j.mainTension === j.crossTension) return `${j.mainTension} ${j.tensionUnit}`;
    return `${j.mainTension ?? "?"} / ${j.crossTension ?? "?"} ${j.tensionUnit}`;
  };

  return (
    <div className="rec-wrap">
      <div className="g4" style={{ marginBottom: 4 }}>
        <Card>
          <div className="lab">Active jobs</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6 }}>{stats.activeJobs}</div>
        </Card>
        <Card>
          <div className="lab">Due today</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6 }}>{stats.dueToday}</div>
        </Card>
        <Card>
          <div className="lab">Ready for collection</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6 }}>{stats.readyForCollection}</div>
        </Card>
        <Card>
          <div className="lab">Completed this month</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6 }}>{stats.completedThisMonth}</div>
        </Card>
      </div>

      <div className="rec-tools">
        <Input iconLeft="search" placeholder="Search customer, phone, racket, job ID or string" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle()}>
          <option value="">All statuses</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={selectStyle()}>
          <option value="">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
        </select>
        <select value={due} onChange={(e) => setDue(e.target.value as DueFilter)} style={selectStyle()}>
          <option value="">Any due date</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="none">No due date</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ ...selectStyle(), marginLeft: "auto" }}>
          <option value="receivedOn">Sort: date received</option>
          <option value="dueOn">Sort: due date</option>
          <option value="status">Sort: status</option>
          <option value="price">Sort: price</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="rec-empty">{jobs.length === 0 ? "No string jobs yet. Create the first one to get started." : `No match for the current search/filters.`}</div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Customer</th>
                    <th>Racket</th>
                    <th>String</th>
                    <th className="num">Tension</th>
                    <th>Received</th>
                    <th>Due</th>
                    <th>Status</th>
                    <th className="num">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((j) => (
                    <tr key={j.id} onClick={() => goTo(j.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goTo(j.id)}>
                      <td className="num">{j.code}</td>
                      <td>{j.customerName}</td>
                      <td>
                        {j.racketCode} · {j.racketLabel}
                      </td>
                      <td>{j.setupType === "full" ? j.mainString : `${j.mainString} / ${j.crossString}`}</td>
                      <td className="num">{tensionDisplay(j)}</td>
                      <td className="num">{formatDate(j.receivedOn)}</td>
                      <td className="num">{j.dueOn ? formatDate(j.dueOn) : "—"}</td>
                      <td>
                        <Badge tone={JOB_STATUS_TONE[j.status]} dot>
                          {JOB_STATUS_LABEL[j.status]}
                        </Badge>
                      </td>
                      <td className="num">{formatCents(j.finalPriceCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {filtered.map((j) => (
              <Card key={j.id} interactive onClick={() => goTo(j.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">{j.customerName}</span>
                  <span className="row-s num">{j.code}</span>
                </div>
                <div className="ccard-meta">
                  <span className="row-s num">
                    {j.racketCode} · {j.racketLabel}
                  </span>
                  <span className="row-s num">
                    {j.setupType === "full" ? j.mainString : `${j.mainString} / ${j.crossString}`} · {tensionDisplay(j)}
                  </span>
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Received</span>
                    <span className="num">{formatDate(j.receivedOn)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Due</span>
                    <span className="num">{j.dueOn ? formatDate(j.dueOn) : "—"}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Price</span>
                    <span className="num">{formatCents(j.finalPriceCents)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Status</span>
                    <Badge tone={JOB_STATUS_TONE[j.status]} dot>
                      {JOB_STATUS_LABEL[j.status]}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {jobs.length > 0 ? (
        <div className="row-s" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>
            {filtered.length} of {jobs.length} job{jobs.length === 1 ? "" : "s"}
          </span>
          <Button size="sm" variant="ghost" onClick={() => router.push("/jobs/new")}>
            New string job
          </Button>
        </div>
      ) : null}
    </div>
  );
}
