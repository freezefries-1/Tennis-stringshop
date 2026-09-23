"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { Tabs } from "@/components/ds/tabs";
import { Icon } from "@/components/ds/icon";
import { racketLabel } from "@/lib/racket-label";
import type { RacketWithSpecs } from "@/lib/rackets";
import type { JobHistoryRow } from "@/lib/jobs";
import type { CustomerPurchaseRow } from "@/lib/sales";
import { formatCents, formatDate } from "@/lib/format";
import { JOB_STATUS_LABEL, JOB_STATUS_TONE, PAYMENT_STATUS_LABEL, PAYMENT_STATUS_TONE } from "@/components/jobs/job-status";
import { SALE_PAYMENT_STATUS_LABEL, SALE_PAYMENT_STATUS_TONE, SALE_STATUS_LABEL, SALE_STATUS_TONE } from "@/components/sales/sale-status";

const TABS = [
  { value: "rackets", label: "Rackets" },
  { value: "stringing", label: "Stringing history" },
  { value: "purchases", label: "Purchase history" },
];

export function CustomerProfileTabs({ customerId, rackets: allRackets, jobs, sales }: { customerId: string; rackets: RacketWithSpecs[]; jobs: JobHistoryRow[]; sales: CustomerPurchaseRow[] }) {
  const [tab, setTab] = useState("rackets");
  const [showArchived, setShowArchived] = useState(false);

  const activeCount = allRackets.filter((r) => !r.archivedAt).length;
  const rackets = showArchived ? allRackets : allRackets.filter((r) => !r.archivedAt);

  return (
    <Card padding="0">
      <div style={{ padding: "16px 20px 0" }}>
        <Tabs items={TABS.map((t) => (t.value === "rackets" ? { ...t, count: activeCount } : t))} value={tab} onChange={setTab} />
      </div>
      <div className="tab-panel" style={{ padding: "0 4px 4px" }}>
        {tab === "rackets" ? (
          <>
            {allRackets.some((r) => r.archivedAt) ? (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-600)", padding: "8px 16px 4px" }}>
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show archived
              </label>
            ) : null}
            {rackets.length === 0 ? (
              <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                <span>{allRackets.length === 0 ? "No rackets on file yet." : "No archived rackets."}</span>
                {allRackets.length === 0 ? (
                  <Link href={`/customers/${customerId}/rackets/new`}>
                    <Button size="sm" variant="secondary" iconLeft="plus">
                      Add racket
                    </Button>
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="rows">
                {rackets.map((r) => {
                  const specs = [r.effectiveHeadSizeSqin ? `${r.effectiveHeadSizeSqin} sq in` : null, r.effectiveStringPattern].filter(Boolean).join(" · ");
                  return (
                    <Link key={r.id} href={`/customers/${customerId}/rackets/${r.id}`} className="row">
                      <div className="row-main">
                        <div className="row-t">
                          {racketLabel({ brand: r.effectiveBrand, series: r.effectiveSeries, model: r.effectiveModel, generationYear: r.effectiveGenerationYear, generationName: r.effectiveGenerationName })}
                          {r.archivedAt ? (
                            <span style={{ marginLeft: 8 }}>
                              <Badge tone="neutral">Archived</Badge>
                            </span>
                          ) : null}
                        </div>
                        <div className="row-s num">
                          {r.code}
                          {specs ? ` · ${specs}` : ""}
                          {r.nickname ? ` · ${r.nickname}` : ""}
                        </div>
                      </div>
                      <Icon name="chevron-right" size={16} color="var(--ink-300)" />
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        ) : tab === "stringing" ? (
          jobs.length === 0 ? (
            <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <span>No string jobs on file yet.</span>
              <Link href={`/jobs/new?customerId=${customerId}`}>
                <Button size="sm" variant="secondary" iconLeft="plus">
                  New string job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rows">
              {jobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="row">
                  <div className="row-main">
                    <div className="row-t">{j.racketLabel}</div>
                    <div className="row-s num">
                      {formatDate(j.receivedOn)} · {j.mainString === j.crossString ? j.mainString : `${j.mainString} / ${j.crossString}`} ·{" "}
                      {j.mainTension === j.crossTension ? `${j.mainTension} ${j.tensionUnit}` : `${j.mainTension ?? "?"} / ${j.crossTension ?? "?"} ${j.tensionUnit}`}
                    </div>
                  </div>
                  <div className="row-end">
                    <span className="row-s num">{formatCents(j.finalPriceCents)}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge tone={PAYMENT_STATUS_TONE[j.paymentStatus]}>{PAYMENT_STATUS_LABEL[j.paymentStatus]}</Badge>
                      <Badge tone={JOB_STATUS_TONE[j.status]} dot>
                        {JOB_STATUS_LABEL[j.status]}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : sales.length === 0 ? (
          <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <span>No purchases on file yet.</span>
            <Link href={`/pos?customerId=${customerId}`}>
              <Button size="sm" variant="secondary" iconLeft="plus">
                New sale
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rows">
            {sales.map((s) => (
              <Link key={s.id} href={`/sales/${s.id}`} className="row">
                <div className="row-main">
                  <div className="row-t">{s.itemSummary || s.code}</div>
                  <div className="row-s num">
                    {s.code} · {formatDate(s.occurredAt)}
                  </div>
                </div>
                <div className="row-end">
                  <span className="row-s num">{formatCents(s.totalCents)}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Badge tone={SALE_PAYMENT_STATUS_TONE[s.paymentStatus]}>{SALE_PAYMENT_STATUS_LABEL[s.paymentStatus]}</Badge>
                    <Badge tone={SALE_STATUS_TONE[s.status]} dot>
                      {SALE_STATUS_LABEL[s.status]}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
