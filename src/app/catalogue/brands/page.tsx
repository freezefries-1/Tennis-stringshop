import { listBrands } from "@/lib/racket-catalogue";
import { BrandsView } from "@/components/catalogue/brands-view";

export const dynamic = "force-dynamic";

export default async function BrandsPage() {
  const brands = await listBrands(true);
  return (
    <div className="ph-wrap" style={{ maxWidth: 720 }}>
      <h2 className="ph-title">Brands &amp; series</h2>
      <p className="ph-body">Manage the brands and series that back the racket database. Archiving keeps a brand or series on existing records but hides it from new selections.</p>
      <BrandsView brands={brands} />
    </div>
  );
}
