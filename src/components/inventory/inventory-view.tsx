"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { formatCents, formatMoney0 } from "@/lib/format";
import { ExportCsvButtons } from "./export-csv-buttons";
import type { InventorySummary, StringProductRow } from "@/lib/string-inventory";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

const STATUS_LABEL: Record<StringProductRow["status"], string> = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock" };
const STATUS_TONE: Record<StringProductRow["status"], "success" | "warning" | "danger"> = { in_stock: "success", low_stock: "warning", out_of_stock: "danger" };

function productLabel(p: StringProductRow): string {
  return [p.brand, p.name, p.gauge ? `${p.gauge}mm` : null, p.colour].filter(Boolean).join(" ");
}

/** Weighted average cost of the stock actually remaining (brief §28/§30's
 * "Average / Relevant Cost") — never the latest purchase price. */
function costLabel(p: StringProductRow): string {
  if (p.avgCostPerUnitCents == null) return "—";
  return `${formatCents(p.avgCostPerUnitCents)}/${p.trackingUnit === "set" ? "set" : "m"}`;
}

export function InventoryView({ products, summary, brands, materials }: { products: StringProductRow[]; summary: InventorySummary; brands: string[]; materials: string[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("");
  const [material, setMaterial] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const s = normalize(q);
    return products.filter((p) => {
      if (!showArchived && p.archivedAt) return false;
      if (brand && p.brand !== brand) return false;
      if (material && p.material !== material) return false;
      if (status && p.status !== status) return false;
      if (!s) return true;
      const haystack = [p.brand, p.name, p.colour, p.sku, p.gauge].filter(Boolean).join(" ");
      return normalize(haystack).includes(s);
    });
  }, [products, q, brand, material, status, showArchived]);

  const goTo = (id: string) => router.push(`/inventory/products/${id}`);

  return (
    <div className="rec-wrap">
      <div className="g4" style={{ marginBottom: 4 }}>
        <Card>
          <div className="lab">String products</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6 }}>{summary.totalProducts}</div>
        </Card>
        <Card>
          <div className="lab">Low stock</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6, color: summary.lowStockCount ? "var(--signal-warning)" : undefined }}>{summary.lowStockCount}</div>
        </Card>
        <Card>
          <div className="lab">Out of stock</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6, color: summary.outOfStockCount ? "var(--signal-danger)" : undefined }}>{summary.outOfStockCount}</div>
        </Card>
        <Card>
          <div className="lab">Inventory value</div>
          <div className="ph-t num" style={{ fontSize: 28, marginTop: 6 }}>{formatMoney0(summary.inventoryValueCents)}</div>
        </Card>
      </div>

      <div className="rec-tools">
        <Input iconLeft="search" placeholder="Search brand, string, gauge, colour or SKU" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} style={selectStyle()}>
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select value={material} onChange={(e) => setMaterial(e.target.value)} style={selectStyle()}>
          <option value="">All materials</option>
          {materials.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle()}>
          <option value="">All stock levels</option>
          <option value="in_stock">In stock</option>
          <option value="low_stock">Low stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-600)" }}>
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
        Show archived products
      </label>

      {filtered.length === 0 ? (
        <Card>
          <div className="rec-empty">{products.length === 0 ? "No string products yet. Receive stock to get started." : "No match for the current search/filters."}</div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>String</th>
                    <th>Gauge</th>
                    <th>Colour</th>
                    <th className="num">Stock available</th>
                    <th>Type</th>
                    <th className="num">Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} onClick={() => goTo(p.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goTo(p.id)}>
                      <td>
                        {p.brand} {p.name}
                        {p.archivedAt ? <span className="row-s"> · Archived</span> : null}
                      </td>
                      <td className="num">{p.gauge ? `${p.gauge} mm` : "—"}</td>
                      <td>{p.colour ?? "—"}</td>
                      <td className="num">
                        {p.available}
                        {p.trackingUnit === "set" ? " sets" : "m"}
                      </td>
                      <td>{p.trackingUnit === "set" ? "Sets" : "Reel"}</td>
                      <td className="num">{costLabel(p)}</td>
                      <td>
                        <Badge tone={STATUS_TONE[p.status]} dot>
                          {STATUS_LABEL[p.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="ccards">
            {filtered.map((p) => (
              <Card key={p.id} interactive onClick={() => goTo(p.id)} className="ccard">
                <div className="ccard-top">
                  <span className="ccard-name">{productLabel(p)}</span>
                </div>
                <div className="ccard-meta">
                  <span className="row-s num">{p.trackingUnit === "set" ? "Sold as sets" : "Sold as reels"}</span>
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Available</span>
                    <span className="num">
                      {p.available}
                      {p.trackingUnit === "set" ? " sets" : "m"}
                    </span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Cost</span>
                    <span className="num">{costLabel(p)}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Status</span>
                    <Badge tone={STATUS_TONE[p.status]} dot>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {products.length > 0 ? (
        <div className="row-s">
          {filtered.length} of {products.length} product{products.length === 1 ? "" : "s"}
        </div>
      ) : null}

      <ExportCsvButtons />
    </div>
  );
}
