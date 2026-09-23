"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ds/button";
import { deleteProductAction } from "@/app/products/actions";

/** Permanent delete — reserved for a mistaken entry, separate from
 * ArchiveProductButton. Blocked server-side the moment any batch/sale item
 * exists for the product. */
export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="form-danger" style={{ maxWidth: 440 }}>
        <p>
          <strong>Delete this product permanently?</strong> This removes it from the catalogue for good — it cannot be undone. If it has any batches or sales on file, the delete is blocked; archive it instead.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={() => {
              if (!confirm("Really delete this product permanently? This cannot be undone.")) return;
              startTransition(async () => {
                const result = await deleteProductAction(productId);
                if (result.status === "deleted") {
                  router.push("/products");
                } else {
                  setError("This product has stock or sales on file and can't be deleted — archive it instead.");
                  setConfirming(false);
                }
              });
            }}
          >
            {pending ? "Deleting…" : "Delete permanently"}
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <Button
        size="sm"
        variant="ghost"
        iconLeft="trash"
        style={{ color: "var(--signal-danger)" }}
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
      >
        Delete product
      </Button>
      {error ? <span style={{ fontSize: 12.5, color: "var(--signal-danger)", maxWidth: 260, textAlign: "right" }}>{error}</span> : null}
    </div>
  );
}
