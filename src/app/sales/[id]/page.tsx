import { notFound } from "next/navigation";
import Link from "next/link";
import { getSale, listMovementsForSale } from "@/lib/sales";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Badge } from "@/components/ds/badge";
import { SpecList, type SpecListItem } from "@/components/ds/spec-list";
import { formatCents, formatDate } from "@/lib/format";
import { RecordPaymentPanel } from "@/components/sales/record-payment-panel";
import { CancelSaleButton } from "@/components/sales/cancel-sale-button";
import { ReturnItemPanel } from "@/components/sales/return-item-panel";
import { SALE_PAYMENT_STATUS_LABEL, SALE_PAYMENT_STATUS_TONE, SALE_STATUS_LABEL, SALE_STATUS_TONE, PAYMENT_METHOD_LABEL } from "@/components/sales/sale-status";

export const dynamic = "force-dynamic";

const ITEM_TYPE_LABEL: Record<string, string> = { product: "Product", string_product: "String", string_job_service: "Stringing", custom: "Custom" };
const MOVEMENT_LABEL: Record<string, string> = {
  received: "Stock received",
  sale: "Sold",
  retail_sale: "Sold (reel/set)",
  string_job: "String job usage",
  return: "Returned (restocked)",
  return_no_restock: "Returned (not restocked)",
  manual_add: "Manual addition",
  manual_deduct: "Manual deduction",
  wastage: "Wastage",
  correction: "Stock correction",
  reversal: "Reversal",
};

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();

  const movements = await listMovementsForSale(id);
  const isReversal = sale.totalCents < 0;

  const infoItems: SpecListItem[] = [
    { label: "Sale number", value: <span className="num">{sale.code}</span> },
    { label: "Date", value: formatDate(sale.occurredAt) },
    { label: "Customer", value: sale.customer ? <Link href={`/customers/${sale.customer.id}`} style={{ color: "var(--court-600)" }}>{sale.customer.name}</Link> : "Walk-in" },
    { label: "Linked string job", value: sale.stringJobCode ? <Link href={`/jobs/${sale.stringJobId}`} style={{ color: "var(--court-600)" }}>{sale.stringJobCode}</Link> : "—" },
    { label: "Status", value: <Badge tone={SALE_STATUS_TONE[sale.status]} dot>{SALE_STATUS_LABEL[sale.status]}</Badge> },
    { label: "Reverses sale", value: sale.reversesSaleId ? <Link href={`/sales/${sale.reversesSaleId}`} style={{ color: "var(--court-600)" }}>View original</Link> : "—" },
  ];

  const paymentItems: SpecListItem[] = [
    { label: "Payment status", value: <Badge tone={SALE_PAYMENT_STATUS_TONE[sale.paymentStatus]} dot>{SALE_PAYMENT_STATUS_LABEL[sale.paymentStatus]}</Badge> },
    ...(sale.returnedCents > 0
      ? [
          { label: "Original total", value: <span className="num">{formatCents(sale.totalCents)}</span> },
          { label: "Returned", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{formatCents(sale.returnedCents)}</span> },
          { label: "Net total (after returns)", value: <span className="num">{formatCents(sale.netTotalCents)}</span> },
        ]
      : []),
    { label: "Paid", value: <span className="num">{formatCents(sale.paidCents)}</span> },
    { label: "Balance due", value: <span className="num">{formatCents(sale.balanceDueCents)}</span> },
  ];

  return (
    <div className="ph-wrap" style={{ maxWidth: 960 }}>
      <div className="profile-head">
        <div>
          <div className="profile-id num">{sale.code}</div>
          <h2 className="profile-name">{formatCents(sale.totalCents)}</h2>
          <div className="row-s" style={{ marginTop: 4 }}>
            {formatDate(sale.occurredAt)} · {sale.customer?.name ?? "Walk-in"}
          </div>
        </div>
        <div className="profile-actions">
          <Link href={`/sales/${sale.id}/receipt`}>
            <Button size="sm" variant="secondary" iconLeft="receipt">
              View receipt
            </Button>
          </Link>
          {!isReversal ? <RecordPaymentPanel saleId={sale.id} balanceDueCents={sale.balanceDueCents} /> : null}
          {!isReversal && sale.status === "completed" ? <CancelSaleButton saleId={sale.id} /> : null}
        </div>
      </div>

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Sale
          </div>
          <SpecList dense items={infoItems} />

          <div className="lab" style={{ marginTop: 20, marginBottom: 8 }}>
            Payment
          </div>
          <SpecList dense items={paymentItems} />

          {sale.payments.length > 0 ? (
            <div className="rows" style={{ marginTop: 10 }}>
              {sale.payments.map((p) => (
                <div className="row" key={p.id}>
                  <div className="row-main">
                    <div className="row-t">{PAYMENT_METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}</div>
                    <div className="row-s num">{formatDate(p.paymentDate)}</div>
                  </div>
                  <span className="num">{formatCents(p.amountCents)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {sale.notes ? (
            <>
              <div className="lab" style={{ marginTop: 20, marginBottom: 6 }}>
                Notes
              </div>
              <p style={{ fontSize: 14, color: "var(--ink-700)", lineHeight: 1.5 }}>{sale.notes}</p>
            </>
          ) : null}
        </Card>

        <Card padding="20px 24px">
          <div className="lab" style={{ marginBottom: 8 }}>
            Financials
          </div>
          <SpecList
            dense
            items={[
              { label: "Subtotal", value: <span className="num">{formatCents(sale.subtotalCents)}</span> },
              { label: "Discount", value: <span className="num">−{formatCents(sale.discountCents)}</span> },
              { label: "Total (revenue)", value: <span className="num">{formatCents(sale.totalCents)}</span> },
              { label: "COGS", value: <span className="num" style={{ color: "var(--ink-500)" }}>−{formatCents(sale.cogsCents)}</span> },
              { label: "Gross profit", value: <span className="num">{formatCents(sale.grossProfitCents)}</span> },
            ]}
          />
        </Card>
      </div>

      <div className="lab" style={{ marginTop: 28, marginBottom: 10 }}>
        Sale items
      </div>
      <div style={{ overflowX: "auto" }}>
        <Card padding="0" style={{ display: "inline-block", minWidth: "100%" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th className="num">Qty</th>
                <th className="num">Unit price</th>
                <th className="num">Discount</th>
                <th className="num">Line total</th>
                <th className="num">COGS</th>
                <th className="num">Gross profit</th>
                {!isReversal ? <th>Return</th> : null}
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => {
                const outstanding = Number(item.quantity) - Number(item.returnedQuantity);
                return (
                  <tr key={item.id}>
                    <td>
                      {item.descriptionSnapshot}
                      {Number(item.returnedQuantity) > 0 ? <span className="row-s"> · {item.returnedQuantity} returned</span> : null}
                    </td>
                    <td>{ITEM_TYPE_LABEL[item.itemType] ?? item.itemType}</td>
                    <td className="num">{item.quantity}</td>
                    <td className="num">{formatCents(item.unitPriceCents)}</td>
                    <td className="num">{item.discountCents > 0 ? `−${formatCents(item.discountCents)}` : "—"}</td>
                    <td className="num">{formatCents(item.lineTotalCents)}</td>
                    <td className="num" style={{ color: "var(--ink-500)" }}>
                      {item.cogsAmountCents !== 0 ? formatCents(item.cogsAmountCents) : "—"}
                    </td>
                    <td className="num">{formatCents(item.grossProfitCents)}</td>
                    {!isReversal ? (
                      <td>
                        <ReturnItemPanel saleItemId={item.id} outstandingQty={outstanding} unitPriceCents={item.unitPriceCents} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="lab" style={{ marginTop: 28, marginBottom: 10 }}>
        Inventory movements
      </div>
      {movements.length === 0 ? (
        <Card>
          <div className="rec-empty">No inventory-affecting lines on this sale.</div>
        </Card>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Card padding="0" style={{ display: "inline-block", minWidth: "100%" }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th className="num">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="num">{formatDate(m.occurredAt)}</td>
                    <td>{m.label}</td>
                    <td>{MOVEMENT_LABEL[m.movementType] ?? m.movementType}</td>
                    <td className="num">
                      {Number(m.quantityChange) > 0 ? "+" : ""}
                      {m.quantityChange}
                      {m.unit === "m" ? "m" : m.unit === "set" ? " sets" : ""}
                    </td>
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
