import { notFound } from "next/navigation";
import { getSale } from "@/lib/sales";
import { getJob } from "@/lib/jobs";
import { formatCents, formatDate } from "@/lib/format";
import { PAYMENT_METHOD_LABEL } from "@/components/sales/sale-status";
import { PrintButton } from "@/components/sales/print-button";

export const dynamic = "force-dynamic";

/** Customer-facing (brief §38) — deliberately excludes COGS, purchase
 * cost, gross profit and internal notes; a plain, printable summary of
 * what was bought and paid. For a string-job sale, racket/string/tension
 * are useful context, kept minimal. */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await getSale(id);
  if (!sale) notFound();
  const job = sale.stringJobId ? await getJob(sale.stringJobId) : null;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px", fontFamily: "var(--font-body)", color: "var(--ink-900)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20 }}>SportCraft</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Racket stringing &amp; equipment</div>
        </div>
        <PrintButton />
      </div>

      <div style={{ borderTop: "1px dashed var(--ink-300)", borderBottom: "1px dashed var(--ink-300)", padding: "12px 0", marginBottom: 16, fontSize: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Receipt</span>
          <span className="num">{sale.code}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Date</span>
          <span className="num">{formatDate(sale.occurredAt)}</span>
        </div>
        {sale.customer ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Customer</span>
            <span>{sale.customer.name}</span>
          </div>
        ) : null}
      </div>

      {job ? (
        <div style={{ fontSize: 13.5, color: "var(--ink-700)", marginBottom: 16 }}>
          <div>
            Racket: {job.racketLabel} ({job.racket.code})
          </div>
          {job.strings[0] ? (
            <div>
              String: {job.strings[0].brandSnapshot} {job.strings[0].stringNameSnapshot} @ {job.strings[0].tension}
              {job.strings[0].tensionUnit}
            </div>
          ) : null}
        </div>
      ) : null}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 16 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--ink-200)" }}>
            <th style={{ textAlign: "left", padding: "6px 0" }}>Item</th>
            <th style={{ textAlign: "right", padding: "6px 0" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "6px 0" }}>Price</th>
            <th style={{ textAlign: "right", padding: "6px 0" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: "6px 0" }}>{item.descriptionSnapshot}</td>
              <td className="num" style={{ textAlign: "right", padding: "6px 0" }}>
                {item.quantity}
              </td>
              <td className="num" style={{ textAlign: "right", padding: "6px 0" }}>
                {formatCents(item.unitPriceCents)}
              </td>
              <td className="num" style={{ textAlign: "right", padding: "6px 0" }}>
                {formatCents(item.lineTotalCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: 14, borderTop: "1px solid var(--ink-200)", paddingTop: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Subtotal</span>
          <span className="num">{formatCents(sale.subtotalCents)}</span>
        </div>
        {sale.discountCents > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount</span>
            <span className="num">−{formatCents(sale.discountCents)}</span>
          </div>
        ) : null}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 6 }}>
          <span>Total</span>
          <span className="num">{formatCents(sale.totalCents)}</span>
        </div>
      </div>

      {sale.payments.length > 0 ? (
        <div style={{ fontSize: 13.5, color: "var(--ink-700)", marginTop: 14, borderTop: "1px dashed var(--ink-300)", paddingTop: 10 }}>
          {sale.payments.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{PAYMENT_METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}</span>
              <span className="num">{formatCents(p.amountCents)}</span>
            </div>
          ))}
          {sale.balanceDueCents > 0 ? (
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
              <span>Balance due</span>
              <span className="num">{formatCents(sale.balanceDueCents)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-400)", marginTop: 28 }}>Thank you!</div>
    </div>
  );
}
