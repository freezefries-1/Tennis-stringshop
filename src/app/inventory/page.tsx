import { getInventorySummary, listBrandsInUse, listMaterialsInUse, listStringProducts } from "@/lib/string-inventory";
import { InventoryView } from "@/components/inventory/inventory-view";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [products, summary, brands, materials] = await Promise.all([
    listStringProducts({ includeArchived: true }),
    getInventorySummary(),
    listBrandsInUse(),
    listMaterialsInUse(),
  ]);

  return <InventoryView products={products} summary={summary} brands={brands} materials={materials} />;
}
