"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Tabs } from "@/components/ds/tabs";
import { Icon } from "@/components/ds/icon";
import { racketLabel } from "@/lib/racket-label";
import type { RacketWithSpecs } from "@/lib/rackets";

const TABS = [
  { value: "rackets", label: "Rackets" },
  { value: "stringing", label: "Stringing history" },
  { value: "purchases", label: "Purchase history" },
];

function NotBuiltYet({ phase, action, actionHref }: { phase: number; action: string; actionHref: string }) {
  return (
    <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
      <span>Not tracked yet — Phase {phase} adds this.</span>
      <Link href={actionHref}>
        <Button size="sm" variant="secondary">
          {action}
        </Button>
      </Link>
    </div>
  );
}

export function CustomerProfileTabs({ customerId, rackets }: { customerId: string; rackets: RacketWithSpecs[] }) {
  const [tab, setTab] = useState("rackets");

  return (
    <Card padding="0">
      <div style={{ padding: "16px 20px 0" }}>
        <Tabs items={TABS.map((t) => (t.value === "rackets" ? { ...t, count: rackets.length } : t))} value={tab} onChange={setTab} />
      </div>
      <div className="tab-panel" style={{ padding: "0 4px 4px" }}>
        {tab === "rackets" ? (
          rackets.length === 0 ? (
            <div className="rec-empty" style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <span>No rackets on file yet.</span>
              <Link href={`/customers/${customerId}/rackets/new`}>
                <Button size="sm" variant="secondary" iconLeft="plus">
                  Add racket
                </Button>
              </Link>
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
          )
        ) : tab === "stringing" ? (
          <NotBuiltYet phase={4} action="New string job" actionHref="/jobs" />
        ) : (
          <NotBuiltYet phase={6} action="New sale" actionHref="/pos" />
        )}
      </div>
    </Card>
  );
}
