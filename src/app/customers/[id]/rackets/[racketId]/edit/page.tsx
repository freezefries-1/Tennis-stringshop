import { notFound } from "next/navigation";
import { getRacket } from "@/lib/rackets";
import { RacketForm } from "@/components/customers/racket-form";
import { updateRacketAction } from "@/app/customers/racket-actions";
import type { RacketFormState } from "@/lib/racket-form-types";

export const dynamic = "force-dynamic";

export default async function EditRacketPage({ params }: { params: Promise<{ id: string; racketId: string }> }) {
  const { id, racketId } = await params;
  const found = await getRacket(racketId);
  if (!found || found.racket.customerId !== id) notFound();
  const { racket, owner } = found;

  const initialState: RacketFormState = {
    status: "idle",
    values: {
      brand: racket.brand ?? "",
      series: racket.series ?? "",
      model: racket.model ?? "",
      generationYear: racket.generationYear?.toString() ?? "",
      headSizeSqin: racket.headSizeSqin ?? "",
      stringPattern: racket.stringPattern ?? "",
      gripSize: racket.gripSize ?? "",
      staticWeightG: racket.staticWeightG?.toString() ?? "",
      swingweight: racket.swingweight?.toString() ?? "",
      balanceMm: racket.balanceMm?.toString() ?? "",
      customisationNotes: racket.customisationNotes ?? "",
      notes: racket.notes ?? "",
    },
  };

  return (
    <div className="ph-wrap">
      <div className="lab">
        {owner.name} · {racket.code}
      </div>
      <h2 className="ph-title">Edit racket</h2>
      <RacketForm action={updateRacketAction.bind(null, id, racketId)} initialState={initialState} submitLabel="Save changes" />
    </div>
  );
}
