import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/customers";
import { RacketForm } from "@/components/customers/racket-form";
import { createRacketAction } from "@/app/customers/racket-actions";
import { emptyRacketFormState } from "@/lib/racket-form-types";

export const dynamic = "force-dynamic";

export default async function NewRacketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="ph-wrap">
      <div className="lab">{customer.name} · {customer.code}</div>
      <h2 className="ph-title">Add racket</h2>
      <RacketForm action={createRacketAction.bind(null, id)} initialState={emptyRacketFormState} submitLabel="Save racket" />
    </div>
  );
}
