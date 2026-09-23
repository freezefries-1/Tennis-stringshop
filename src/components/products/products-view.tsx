"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ds/input";
import { Card } from "@/components/ds/card";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { StatBlock } from "@/components/ds/stat-block";
import { formatCents } from "@/lib/format";
import type { ProductCategory, ProductRow } from "@/lib/products";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 };
}

const STATUS_LABEL: Record<ProductRow["status"], string> = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock", not_tracked: "Not tracked" };
const STATUS_TONE: Record<ProductRow["status"], "success" | "warning" | "danger" | "neutral"> = { in_stock: "success", low_stock: "warning", out_of_stock: "danger", not_tracked: "neutral" };

function productLabel(p: ProductRow): string {
  return [p.brand, p.name, p.variant].filter(Boolean).join(" ");
}

export function ProductsView({ products, categories }: { products: ProductRow[]; categories: ProductCategory[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filtered = useMemo(() => {
    const s = normalize(q);
    return products.filter((p) => {
      if (!showArchived && p.archivedAt) return false;
      if (categoryId && p.categoryId !== categoryId) return false;
      if (status && p.status !== status) return false;
      if (!s) return true;
      const haystack = [p.brand, p.name, p.variant, p.sku, p.barcode, p.categoryName].filter(Boolean).join(" ");
      return normalize(haystack).includes(s);
    });
  }, [products, q, categoryId, status, showArchived]);

  // At cost — available units × weighted average cost per unit, summed
  // across whatever's currently filtered/visible. Untracked products don't
  // carry a countable stock value, so they're excluded rather than shown
  // as $0.
  const totalValueCents = useMemo(
    () => filtered.reduce((sum, p) => (p.trackInventory && p.avgCostPerUnitCents != null ? sum + Math.round(p.available * p.avgCostPerUnitCents) : sum), 0),
    [filtered],
  );

  const goTo = (id: string) => router.push(`/products/${id}`);

  return (
    <div className="rec-wrap">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <Card>
          <StatBlock label="Total inventory value" value={formatCents(totalValueCents)} icon="banknote" />
          <div className="row-s" style={{ marginTop: 12 }}>
            At cost, across {filtered.filter((p) => p.trackInventory).length} tracked product{filtered.filter((p) => p.trackInventory).length === 1 ? "" : "s"}
          </div>
        </Card>
      </div>

      <div className="rec-tools">
        <Input iconLeft="search" placeholder="Search product, brand, variant, SKU or barcode" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={selectStyle()}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--ink-600)" }}>
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived products
        </label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href="/products/categories">
            <Button size="sm" variant="ghost">
              Manage categories
            </Button>
          </Link>
          <Link href="/products/receive">
            <Button size="sm" variant="secondary" iconLeft="plus">
              Receive stock
            </Button>
          </Link>
          <Link href="/products/new">
            <Button size="sm" iconLeft="plus">
              Add product
            </Button>
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="rec-empty">{products.length === 0 ? "No products yet. Add one to get started." : "No match for the current search/filters."}</div>
        </Card>
      ) : (
        <>
          <div className="dtable-wrap">
            <Card padding="0">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Variant</th>
                    <th className="num">Selling price</th>
                    <th className="num">Stock</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} onClick={() => goTo(p.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && goTo(p.id)}>
                      <td>
                        {p.name}
                        {p.archivedAt ? <span className="row-s"> · Archived</span> : null}
                      </td>
                      <td>{p.brand ?? "—"}</td>
                      <td>{p.categoryName}</td>
                      <td>{p.variant ?? "—"}</td>
                      <td className="num">{p.defaultSellingPriceCents != null ? formatCents(p.defaultSellingPriceCents) : "—"}</td>
                      <td className="num">{p.trackInventory ? p.available : "—"}</td>
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
                  <span className="row-s num">{p.categoryName}</span>
                </div>
                <div className="ccard-stats">
                  <div className="ccard-stat">
                    <span className="lab">Price</span>
                    <span className="num">{p.defaultSellingPriceCents != null ? formatCents(p.defaultSellingPriceCents) : "—"}</span>
                  </div>
                  <div className="ccard-stat">
                    <span className="lab">Stock</span>
                    <span className="num">{p.trackInventory ? p.available : "—"}</span>
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
    </div>
  );
}
