import { notFound } from "next/navigation";
import { getModelWithNames } from "@/lib/racket-catalogue";
import { ModelForm } from "@/components/catalogue/model-form";
import { updateModelAction } from "@/app/catalogue/actions";
import type { ModelFormState } from "@/lib/model-form-types";
import { db } from "@/db/client";
import { racketBrands, racketSeries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = await getModelWithNames(id);
  if (!model) notFound();

  const [series] = await db.select().from(racketSeries).where(eq(racketSeries.id, model.seriesId)).limit(1);
  const [brand] = await db.select().from(racketBrands).where(eq(racketBrands.id, series.brandId)).limit(1);

  const initialState: ModelFormState = {
    status: "idle",
    values: {
      seriesId: model.seriesId,
      model: model.model,
      generationYear: model.generationYear?.toString() ?? "",
      generationName: model.generationName ?? "",
      headSizeSqin: model.headSizeSqin ?? "",
      stringPatternMains: model.stringPatternMains?.toString() ?? "",
      stringPatternCrosses: model.stringPatternCrosses?.toString() ?? "",
      unstrungWeightG: model.unstrungWeightG?.toString() ?? "",
      standardBalanceMm: model.standardBalanceMm?.toString() ?? "",
      standardLengthIn: model.standardLengthIn ?? "",
      recommendedTensionMinLbs: model.recommendedTensionMinLbs ?? "",
      recommendedTensionMaxLbs: model.recommendedTensionMaxLbs ?? "",
      notes: model.notes ?? "",
    },
  };

  return (
    <div className="ph-wrap">
      <div className="lab">
        {model.brandName} · {model.seriesName}
      </div>
      <h2 className="ph-title">Edit racket model</h2>
      <ModelForm action={updateModelAction.bind(null, id)} initialState={initialState} initialBrand={brand} initialSeries={series} submitLabel="Save changes" />
    </div>
  );
}
