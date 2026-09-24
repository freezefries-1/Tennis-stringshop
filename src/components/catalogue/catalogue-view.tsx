"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import Link from "next/link";
import { racketLabel, formatStringPattern } from "@/lib/racket-label";
import type { RacketBrand, RacketModelWithNames } from "@/lib/racket-catalogue";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function CatalogueView({ models, brands }: { models: RacketModelWithNames[]; brands: RacketBrand[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const s = normalize(q);
    return models.filter((m) => {
      if (!showArchived && m.archivedAt) return false;
      if (brandId && m.brandName !== brands.find((b) => b.id === brandId)?.name) return false;
      if (!s) return true;
      const hay = [m.brandName, m.seriesName, m.model, m.generationName ?? "", m.generationYear?.toString() ?? ""].join(" ");
      return normalize(hay).includes(s);
    });
  }, [models, q, brandId, showArchived, brands]);

  const goTo = (id: string) => router.push(`/catalogue/models/${id}`);

  return (
    <div className="rec-wrap">
      <div className="rec-tools">
        <Input iconLeft="search" placeholder="Search brand, series, model or year" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 }}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-600)", whiteSpace: "nowrap" }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
        <Link href="/catalogue/brands" className="rec-tools-push" style={{ fontSize: 13.5, color: "var(--court-600)", whiteSpace: "nowrap" }}>
          Manage brands &amp; series
        </Link>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="rec-empty">{models.length === 0 ? "No racket models yet. Add the first one to get started." : `No match for “${q}”.`}</div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th>Series</th>
                    <th>Model</th>
                    <th>Generation</th>
                    <th>Head size</th>
                    <th>Pattern</th>
                    <th className="num">Weight</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} onClick={() => goTo(m.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goTo(m.id)}>
                      <td>{m.brandName}</td>
                      <td>{m.seriesName}</td>
                      <td>{m.model}</td>
                      <td className="num">{[m.generationName, m.generationYear].filter(Boolean).join(" / ") || "—"}</td>
                      <td className="num">{m.headSizeSqin ? `${m.headSizeSqin} sq in` : "—"}</td>
                      <td className="num">{formatStringPattern(m.stringPatternMains, m.stringPatternCrosses) ?? "—"}</td>
                      <td className="num">{m.unstrungWeightG ? `${m.unstrungWeightG} g` : "—"}</td>
                      <td>{m.archivedAt ? <Badge tone="neutral">Archived</Badge> : <Badge tone="success">Active</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {filtered.map((m) => (
              <Card key={m.id} interactive onClick={() => goTo(m.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">{racketLabel({ brand: m.brandName, series: m.seriesName, model: m.model, generationYear: m.generationYear, generationName: m.generationName })}</span>
                  {m.archivedAt ? <Badge tone="neutral">Archived</Badge> : null}
                </div>
                <div className="ccard-meta">
                  <span className="row-s num">{m.headSizeSqin ? `${m.headSizeSqin} sq in` : "—"}</span>
                  <span className="row-s num">{formatStringPattern(m.stringPatternMains, m.stringPatternCrosses) ?? "—"}</span>
                  <span className="row-s num">{m.unstrungWeightG ? `${m.unstrungWeightG} g` : "—"}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
