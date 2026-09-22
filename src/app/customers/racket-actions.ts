"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRacket, updateRacket, type RacketInput } from "@/lib/rackets";
import type { RacketFormState, RacketFormValues } from "@/lib/racket-form-types";

function readValues(formData: FormData): RacketFormValues {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const mode = get("mode") === "manual" ? "manual" : "database";
  return {
    mode,
    racketModelId: get("racketModelId"),
    nickname: get("nickname"),
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
  const database = values.mode === "database";
  return {
    racketModelId: database ? values.racketModelId || null : null,
    nickname: values.nickname || null,
    // Manual fields only apply outside database mode — a database-mode save
    // shouldn't carry over stale text from a previous manual attempt.
    brand: database ? null : values.brand || null,
    series: database ? null : values.series || null,
    model: database ? null : values.model || null,
    generationYear: database ? null : toInt(values.generationYear),
    headSizeSqin: database ? null : values.headSizeSqin || null,
    stringPattern: database ? null : values.stringPattern || null,
    gripSize: values.gripSize || null,
    staticWeightG: toInt(values.staticWeightG),
    swingweight: toInt(values.swingweight),
    balanceMm: toInt(values.balanceMm),
    customisationNotes: values.customisationNotes || null,
    notes: values.notes || null,
  };
}

function validate(values: RacketFormValues): string | null {
  if (values.mode === "database") {
    return values.racketModelId ? null : "Select a racket model, or switch to manual entry.";
  }
  return values.brand || values.series || values.model ? null : "Enter at least a brand, series or model so this racket can be told apart from others.";
}

export async function createRacketAction(customerId: string, prevState: RacketFormState, formData: FormData): Promise<RacketFormState> {
  const values = readValues(formData);
  const error = validate(values);
  if (error) return { status: "error", message: error, values };

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
  const error = validate(values);
  if (error) return { status: "error", message: error, values };

  await updateRacket(racketId, toInput(values));
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/rackets/${racketId}`);
  redirect(`/customers/${customerId}/rackets/${racketId}`);
}
