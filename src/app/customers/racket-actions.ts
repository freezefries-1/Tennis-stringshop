"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRacket, updateRacket, type RacketInput } from "@/lib/rackets";
import type { RacketFormState, RacketFormValues } from "@/lib/racket-form-types";

function readValues(formData: FormData): RacketFormValues {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    brand: get("brand"),
    series: get("series"),
    model: get("model"),
    generationYear: get("generationYear"),
    headSizeSqin: get("headSizeSqin"),
    stringPattern: get("stringPattern"),
    gripSize: get("gripSize"),
    staticWeightG: get("staticWeightG"),
    swingweight: get("swingweight"),
    balanceMm: get("balanceMm"),
    customisationNotes: get("customisationNotes"),
    notes: get("notes"),
  };
}

function toInt(s: string): number | null {
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function toInput(values: RacketFormValues): RacketInput {
  return {
    brand: values.brand || null,
    series: values.series || null,
    model: values.model || null,
    generationYear: toInt(values.generationYear),
    headSizeSqin: values.headSizeSqin || null,
    stringPattern: values.stringPattern || null,
    gripSize: values.gripSize || null,
    staticWeightG: toInt(values.staticWeightG),
    swingweight: toInt(values.swingweight),
    balanceMm: toInt(values.balanceMm),
    customisationNotes: values.customisationNotes || null,
    notes: values.notes || null,
  };
}

export async function createRacketAction(customerId: string, prevState: RacketFormState, formData: FormData): Promise<RacketFormState> {
  const values = readValues(formData);
  if (!values.brand && !values.series && !values.model) {
    return { status: "error", message: "Enter at least a brand, series or model so this racket can be told apart from others.", values };
  }
  const created = await createRacket(customerId, toInput(values));
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}/rackets/${created.id}`);
}

export async function updateRacketAction(
  customerId: string,
  racketId: string,
  prevState: RacketFormState,
  formData: FormData,
): Promise<RacketFormState> {
  const values = readValues(formData);
  if (!values.brand && !values.series && !values.model) {
    return { status: "error", message: "Enter at least a brand, series or model so this racket can be told apart from others.", values };
  }
  await updateRacket(racketId, toInput(values));
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/rackets/${racketId}`);
  redirect(`/customers/${customerId}/rackets/${racketId}`);
}
