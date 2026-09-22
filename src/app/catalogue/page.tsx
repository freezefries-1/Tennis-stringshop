import { listBrands, searchModels } from "@/lib/racket-catalogue";
import { CatalogueView } from "@/components/catalogue/catalogue-view";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const [models, brands] = await Promise.all([searchModels({ includeArchived: true }), listBrands(true)]);
  return <CatalogueView models={models} brands={brands} />;
}
