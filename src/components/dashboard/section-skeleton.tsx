import { Card } from "@/components/ds/card";

/** Suspense fallback for a dashboard section that now streams in separately
 * — see app/dashboard/page.tsx's comment. Just a placeholder height so the
 * layout doesn't jump when the real content arrives. */
export function SectionSkeleton({ label, height }: { label: string; height: number }) {
  return (
    <Card padding="18px" style={{ height, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="row-s">Loading {label.toLowerCase()}…</div>
    </Card>
  );
}
