import { notFound } from "next/navigation";
import Link from "next/link";
import { getProduct, listBatchesForProduct, listMovementsForProduct } from "@/lib/products";
import { listSalesForProduct } from "@/lib/sales";
import { listSuppliers } from "@/lib/string-inventory";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { formatCents, formatDate } from "@/lib/format";
import { AdjustStockPanel } from "@/components/products/adjust-stock-panel";
import { ArchiveProductButton } from "@/components/products/archive-product-button";
import { DeleteProductButton } from "@/components/products/delete-product-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock", not_tracked: "Not tracked" };
const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = { in_stock: "success", low_stock: "warning", out_of_stock: "danger", not_tracked: "neutral" };
const BATCH_STATUS_TONE: Record<string, "success" | "neutral" | "danger"> = { active: "success", depleted: "neutral", archived: "neutral" };
const MOVEMENT_LABEL: Record<string, string> = {
  received: "Stock received",
  sale: "Sold",
  return: "Returned (restocked)",
  return_no_restock: "Returned (not restocked)",
  manual_add: "Manual addition",
  manual_deduct: "Manual deduction",
  wastage: "Wastage",
  correction: "Stock correction",
  reversal: "Reversal",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [batches, movements, sales, suppliers] = await Promise.all([listBatchesForProduct(id), listMovementsForProduct(id, 200), listSalesForProduct(id), listSuppliers()]);

  const infoItems: SpecListItem[] = [
    { label: "Brand", value: product.brand ?? "—" },
    { label: "Name", value: product.name },
    { label: "Category", value: product.categoryName },
    { label: "Variant", value: product.variant ?? "—" },
    { label: "SKU", value: product.sku ?? "—" },
    { label: "Barcode", value: product.barcode ?? "—" },
    { label: "Selling price", value: product.defaultSellingPriceCents != null ? formatCents(product.defaultSellingPriceCents) : "—" },
    // Once stock is tracked, cost is driven by batches (each received at its
    // own price) — the weighted average across active batches reflects what
    // stock on hand actually cost, unlike costPriceCents (a static value set
    // once, e.g. at product creation, that never updates as new batches
    // come in at different prices). Untracked products have no batches, so
    // costPriceCents — used directly as this product's COGS in that mode —
    // is the only real figure to show.
    product.trackInventory
      ? { label: "Average cost", value: product.avgCostPerUnitCents != null ? formatCents(Math.round(product.avgCostPerUnitCents)) : "—" }
      : { label: "Cost price", value: product.costPriceCents != null ? formatCents(product.costPriceCents) : "—" },
  ];

  const stockItems: SpecListItem[] = product.trackInventory
    ? [
        { label: "Available", value: <span className="num">{product.available}</span> },
        { label: "Active batches", value: product.activeBatches },
        { label: "Stock value (at cost)", value: product.avgCostPerUnitCents != null ? <span className="num">{formatCents(Math.round(product.available * product.avgCostPerUnitCents))}</span> : "—" },
        { label: "Low stock threshold", value: `${product.effectiveThreshold} units${product.lowStockThreshold == null ? " (default)" : ""}` },
        { label: "Status", value: <Badge tone={STATUS_TONE[product.status]} dot>{STATUS_LABEL[product.status]}</Badge> },
      ]
    : [{ label: "Inventory tracking", value: "Not tracked — always sellable, no stock count" }];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="row-s">{product.archivedAt ? "Archived" : "Active"}</div>
          <h2 className="profile-name">
            {product.brand} {product.name}
          </h2>
          <div className="row-s" style={{ marginTop: 4 }}>
            {[product.categoryName, product.variant].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="profile-actions">
          {product.trackInventory ? (
            <Link href={`/products/receive?productId=${product.id}`}>
              <Button size="sm" iconLeft="plus">
                Receive stock
              </Button>
            </Link>
          ) : null}
          <Link href={`/products/${product.id}/edit`}>
            <Button size="sm" variant="secondary" iconLeft="pencil">
              Edit product
            </Button>
          </Link>
          <ArchiveProductButton productId={product.id} archived={!!product.archivedAt} />
          <DeleteProductButton productId={product.id} />
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Product information
          </div>
          <SpecList dense items={infoItems} />
          {product.notes ? (
            <>
              <div className="lab" style={{ marginTop: 20, marginBottom: 6 }}>
                Notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{product.notes}</p>
            </>
          ) : null}
        </Card>

        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Stock summary
          </div>
          <SpecList dense items={stockItems} />

          {product.trackInventory ? (
            <>
              <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
                Adjust stock
              </div>
              <AdjustStockPanel productId={product.id} batches={batches} suppliers={suppliers} />
            </>
          ) : null}
        </Card>
      </div>

      {product.trackInventory ? (
        <>
          <div className="lab" style={{ marginTop: 28, marginBottom: 10 }}>
            Batches
          </div>
          {batches.length === 0 ? (
            <Card>
              <div className="rec-empty">No batches yet — receive stock to create the first one.</div>
            </Card>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Card padding="0" style={{ display: "inline-block", minWidth: "100%" }}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Purchase date</th>
                      <th>Supplier</th>
                      <th className="num">Original</th>
                      <th className="num">Remaining</th>
                      <th className="num">Purchase cost</th>
                      <th className="num">Cost per unit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b) => (
                      <tr key={b.id}>
                        <td className="num">
                          {b.batchNumber}
                          {b.isOpeningStock ? <span className="row-s"> · Opening</span> : null}
                        </td>
                        <td className="num">{formatDate(b.purchaseDate)}</td>
                        <td>{b.supplierName ?? "—"}</td>
                        <td className="num">{b.originalQuantity}</td>
                        <td className="num">{b.remainingQuantity}</td>
                        <td className="num">{formatCents(b.purchaseCostCents)}</td>
                        <td className="num">{formatCents(Math.round(Number(b.costPerUnitCents)))}</td>
                        <td>
                          <Badge tone={BATCH_STATUS_TONE[b.status]} dot>
                            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

          <div className="lab" style={{ marginTop: 28, marginBottom: 10 }}>
            Movement history
          </div>
          {movements.length === 0 ? (
            <Card>
              <div className="rec-empty">No movements yet.</div>
            </Card>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <Card padding="0" style={{ display: "inline-block", minWidth: "100%" }}>
                <table className="dtable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Batch</th>
                      <th className="num">Quantity</th>
                      <th>Sale</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className="num">{formatDate(m.occurredAt)}</td>
                        <td>
                          {MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                          {m.stockOverride ? (
                            <span>
                              {" "}
                              <Badge tone="warning">Override</Badge>
                            </span>
                          ) : null}
                        </td>
                        <td className="num">{m.batchNumber}</td>
                        <td className="num">
                          {m.quantityChange > 0 ? "+" : ""}
                          {m.quantityChange}
                        </td>
                        <td className="num">{m.saleCode ?? "—"}</td>
                        <td>{m.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
        </>
      ) : null}

      <div className="lab" style={{ marginTop: 28, marginBottom: 10 }}>
        Sales history
      </div>
      {sales.length === 0 ? (
        <Card>
          <div className="rec-empty">Not sold yet.</div>
        </Card>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Card padding="0" style={{ display: "inline-block", minWidth: "100%" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Date</th>
                  <th className="num">Qty</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.saleItemId}>
                    <td className="num">
                      <Link href={`/sales/${s.saleId}`} style={{ color: "var(--court-600)" }}>
                        {s.saleCode}
                      </Link>
                    </td>
                    <td className="num">{formatDate(s.occurredAt)}</td>
                    <td className="num">{s.quantity}</td>
                    <td className="num">{formatCents(s.lineTotalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
