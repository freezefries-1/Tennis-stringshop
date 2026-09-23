"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ds/badge";
import { Button } from "@/components/ds/button";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { formatCents } from "@/lib/format";
import { addProductToJobSaleAction, fetchProductsForJobPicker, recordJobSalePaymentAction } from "@/app/jobs/actions";
import { SALE_PAYMENT_STATUS_LABEL, SALE_PAYMENT_STATUS_TONE } from "@/components/sales/sale-status";
import type { SaleDetail, PaymentMethod } from "@/lib/sales";
import type { PosSearchResult } from "@/app/pos/actions";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "paynow", label: "PayNow" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
];

function TakePaymentForm({ saleId, jobId, balanceDueCents }: { saleId: string; jobId: string; balanceDueCents: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState((balanceDueCents / 100).toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("paynow");
  const [saving, setSaving] = useState(false);

  if (balanceDueCents <= 0) return <Badge tone="success">Paid in full</Badge>;

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Take payment
      </Button>
    );
  }

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
      <Field label="Amount">
        <Input type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} suffix="SGD" style={{ width: "100%" }} />
      </Field>
      <Field label="Method">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
          style={{ height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14, width: "100%" }}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          size="sm"
          disabled={saving || Number(amount) <= 0}
          onClick={async () => {
            setSaving(true);
            await recordJobSalePaymentAction(saleId, jobId, Math.round(Number.parseFloat(amount) * 100), method);
            setSaving(false);
            setOpen(false);
            router.refresh();
          }}
        >
          {saving ? "Saving…" : "Save payment"}
        </Button>
        <Button size="sm" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function AddProductForm({ saleId, jobId }: { saleId: string; jobId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PosSearchResult[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = q.trim();
    if (!query) return;
    let active = true;
    const t = setTimeout(async () => {
      const r = await fetchProductsForJobPicker(query);
      if (active) setResults(r.map((p) => ({ key: p.id, kind: "product" as const, id: p.id, label: p.label, sublabel: p.categoryName, priceCents: p.defaultSellingPriceCents, available: p.trackInventory ? p.available : "∞", unit: "unit" })));
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q]);

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Add product to sale
      </Button>
    );
  }

  return (
    <Card tone="sunken" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)" }}>{error}</span> : null}
      <Input placeholder="Search product…" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: "100%" }} />
      {q.trim() ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div className="row-s">No match.</div>
          ) : (
            results.map((r) => (
              <button
                key={r.key}
                type="button"
                className="res"
                disabled={adding === r.id}
                onClick={async () => {
                  setAdding(r.id);
                  setError(null);
                  const result = await addProductToJobSaleAction(saleId, jobId, r.id, 1);
                  setAdding(null);
                  if (!result.ok) {
                    setError(result.reason === "sale_locked" ? "This sale already has a payment — can't add more items to it." : "Not enough stock for this product.");
                    return;
                  }
                  setOpen(false);
                  router.refresh();
                }}
              >
                <span className="res-t">{r.label}</span>
                <span className="res-s num">
                  {r.sublabel} · {r.priceCents != null ? formatCents(r.priceCents) : "—"}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
        Close
      </Button>
    </Card>
  );
}

/** Phase 6 — once a job has a linked Sale, that Sale is the financial
 * source of truth for it (brief §56): this panel replaces the old direct
 * ChangePaymentStatusControl entirely, showing the Sale's own derived
 * payment status and routing "take payment" through recordSalePayment
 * (never stringJobs.paymentStatus again). */
export function LinkedSalePanel({ jobId, sale }: { jobId: string; sale: SaleDetail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link href={`/sales/${sale.id}`} style={{ color: "var(--court-600)", fontWeight: 500 }}>
          {sale.code}
        </Link>
        <Badge tone={SALE_PAYMENT_STATUS_TONE[sale.paymentStatus]} dot>
          {SALE_PAYMENT_STATUS_LABEL[sale.paymentStatus]}
        </Badge>
        <span className="row-s num">
          {formatCents(sale.paidCents)} paid of {formatCents(sale.totalCents)}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <TakePaymentForm saleId={sale.id} jobId={jobId} balanceDueCents={sale.balanceDueCents} />
        <AddProductForm saleId={sale.id} jobId={jobId} />
      </div>
    </div>
  );
}
