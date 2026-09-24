import { notFound } from "next/navigation";
import Link from "next/link";
import { getStringProduct, listBatchesForProduct, listMovementsForProduct } from "@/lib/string-inventory";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { formatCents, formatDate } from "@/lib/format";
import { AdjustStockPanel } from "@/components/inventory/adjust-stock-panel";
import { ArchiveProductButton } from "@/components/inventory/archive-product-button";
import { DeleteProductButton } from "@/components/inventory/delete-product-button";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { in_stock: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock" };
const STATUS_TONE: Record<string, "success" | "warning" | "danger"> = { in_stock: "success", low_stock: "warning", out_of_stock: "danger" };
const BATCH_STATUS_TONE: Record<string, "success" | "neutral" | "danger"> = { active: "success", depleted: "neutral", archived: "neutral" };
const MOVEMENT_LABEL: Record<string, string> = {
  received: "Stock received",
  string_job: "String job usage",
  manual_add: "Manual addition",
  manual_deduct: "Manual deduction",
  wastage: "Wastage",
  correction: "Stock correction",
  reversal: "Reversal",
};

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getStringProduct(id);
  if (!product) notFound();

  const [batches, movements] = await Promise.all([listBatchesForProduct(id), listMovementsForProduct(id, 200)]);
  const unit = product.trackingUnit;

  const infoItems: SpecListItem[] = [
    { label: "Brand", value: product.brand },
    { label: "String", value: product.name },
    { label: "Gauge", value: product.gauge ? `${product.gauge} mm` : "—" },
    { label: "Colour", value: product.colour ?? "—" },
    { label: "Material", value: product.material ?? "—" },
    { label: "SKU", value: product.sku ?? "—" },
    { label: "Sold as", value: unit === "set" ? "Sets" : "Reels (metres)" },
    { label: "Default selling price", value: product.defaultSellingPriceCents != null ? formatCents(product.defaultSellingPriceCents) : "—" },
  ];

  const stockItems: SpecListItem[] = [
    { label: "Available", value: <span className="num">{product.available}{unit === "set" ? " sets" : "m"}</span> },
    { label: "Active batches", value: product.activeBatches },
    { label: "Low stock threshold", value: `${product.effectiveThreshold}${unit === "set" ? " sets" : "m"}${product.lowStockThreshold == null ? " (default)" : ""}` },
    { label: "Status", value: <Badge tone={STATUS_TONE[product.status]} dot>{STATUS_LABEL[product.status]}</Badge> },
  ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="row-s">{product.archivedAt ? "Archived" : "Active"}</div>
          <h2 className="profile-name">
            {product.brand} {product.name}
          </h2>
          <div className="row-s" style={{ marginTop: 4 }}>
            {[product.gauge ? `${product.gauge}mm` : null, product.colour, product.material].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        <div className="profile-actions">
          <Link href={`/inventory/receive?productId=${product.id}`}>
            <Button size="sm" iconLeft="plus">
              Receive stock
            </Button>
          </Link>
          <Link href={`/inventory/products/${product.id}/edit`}>
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

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Adjust stock
          </div>
          <AdjustStockPanel productId={product.id} batches={batches} unit={unit} />
        </Card>
      </div>

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
                  <th className="num">Cost per {unit === "set" ? "set" : "m"}</th>
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
                    <td className="num">
                      {b.originalQuantity}
                      {unit === "set" ? " sets" : "m"}
                    </td>
                    <td className="num">
                      {b.remainingQuantity}
                      {unit === "set" ? " sets" : "m"}
                    </td>
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
                  <th>Job</th>
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
                      {Number(m.quantityChange) > 0 ? "+" : ""}
                      {m.quantityChange}
                      {unit === "set" ? " sets" : "m"}
                    </td>
                    <td className="num">{m.jobCode ?? "—"}</td>
                    <td>{m.reason ?? "—"}</td>
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
