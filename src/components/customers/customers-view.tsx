"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import type { CustomerListRow } from "@/lib/customers";
import { formatCents, formatDate } from "@/lib/format";

function normalize(s: string) {
  return s.trim().toLowerCase();
}
function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export function CustomersView({ customers: allCustomers }: { customers: CustomerListRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const customers = showArchived ? allCustomers : allCustomers.filter((c) => !c.archivedAt);

  const filtered = useMemo(() => {
    const s = normalize(q);
    if (!s) return customers;
    const digits = digitsOnly(q);
    return customers.filter((c) => {
      if (normalize(c.name).includes(s)) return true;
      if (normalize(c.code).includes(s)) return true;
      if (digits && digitsOnly(c.phone).includes(digits)) return true;
      if (!digits && normalize(c.phone).includes(s)) return true;
      return false;
    });
  }, [customers, q]);

  const goTo = (id: string) => router.push(`/customers/${id}`);

  return (
    <div className="rec-wrap">
      <div className="rec-tools">
        <Input
          iconLeft="search"
          placeholder="Search name, phone or customer ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

      {allCustomers.some((c) => c.archivedAt) ? (
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-600)" }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
      ) : null}

      {filtered.length === 0 ? (
        <Card>
          <div className="rec-empty">
            {customers.length === 0 ? "No customers yet. Add the first one to get started." : `No match for “${q}”.`}
          </div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>ID</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th className="num">Rackets</th>
                    <th className="num">Jobs</th>
                    <th>Last visit</th>
                    <th className="num">Lifetime spend</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} onClick={() => goTo(c.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goTo(c.id)}>
                      <td>
                        {c.name}
                        {c.archivedAt ? (
                          <span style={{ marginLeft: 8 }}>
                            <Badge tone="neutral">Archived</Badge>
                          </span>
                        ) : null}
                      </td>
                      <td className="num">{c.code}</td>
                      <td className="num">{c.phone}</td>
                      <td>{c.email ?? "—"}</td>
                      <td className="num">{c.racketCount}</td>
                      <td className="num">{c.jobCount}</td>
                      <td className="num">{formatDate(c.lastVisit)}</td>
                      <td className="num">{formatCents(c.lifetimeSpendCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {filtered.map((c) => (
              <Card key={c.id} interactive onClick={() => goTo(c.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">
                    {c.name}
                    {c.archivedAt ? (
                      <span style={{ marginLeft: 8 }}>
                        <Badge tone="neutral">Archived</Badge>
                      </span>
                    ) : null}
                  </span>
                  <span className="row-s num">{c.code}</span>
                </div>
                <div className="ccard-meta">
                  <span className="row-s num">{c.phone}</span>
                  {c.email ? <span className="row-s num">{c.email}</span> : null}
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Rackets</span>
                    <span className="num">{c.racketCount}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Jobs</span>
                    <span className="num">{c.jobCount}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Last visit</span>
                    <span className="num">{formatDate(c.lastVisit)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Lifetime spend</span>
                    <span className="num">{formatCents(c.lifetimeSpendCents)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
