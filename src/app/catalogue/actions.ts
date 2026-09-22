"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createBrand,
  createModel,
  createSeries,
  findDuplicateModel,
  racketLabelParts,
  renameBrand,
  renameSeries,
  setBrandArchived,
  setModelArchived,
  setSeriesArchived,
  updateModel,
  type RacketModelInput,
} from "@/lib/racket-catalogue";
import { racketLabel } from "@/lib/racket-label";
import type { ModelFormState, ModelFormValues } from "@/lib/model-form-types";

function readValues(formData: FormData): ModelFormValues {
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  return {
    seriesId: get("seriesId"),
    model: get("model"),
    generationYear: get("generationYear"),
    generationName: get("generationName"),
    headSizeSqin: get("headSizeSqin"),
    stringPatternMains: get("stringPatternMains"),
    stringPatternCrosses: get("stringPatternCrosses"),
    unstrungWeightG: get("unstrungWeightG"),
    standardBalanceMm: get("standardBalanceMm"),
    standardLengthIn: get("standardLengthIn"),
    recommendedTensionMinLbs: get("recommendedTensionMinLbs"),
    recommendedTensionMaxLbs: get("recommendedTensionMaxLbs"),
    notes: get("notes"),
  };
}

function toInt(s: string): number | null {
  if (s === "") return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function toInput(values: ModelFormValues): RacketModelInput {
  return {
    seriesId: values.seriesId,
    model: values.model,
    generationYear: toInt(values.generationYear),
    generationName: values.generationName || null,
    headSizeSqin: values.headSizeSqin || null,
    stringPatternMains: toInt(values.stringPatternMains),
    stringPatternCrosses: toInt(values.stringPatternCrosses),
    unstrungWeightG: toInt(values.unstrungWeightG),
    standardBalanceMm: toInt(values.standardBalanceMm),
    standardLengthIn: values.standardLengthIn || null,
    recommendedTensionMinLbs: values.recommendedTensionMinLbs || null,
    recommendedTensionMaxLbs: values.recommendedTensionMaxLbs || null,
    notes: values.notes || null,
  };
}

export async function createModelAction(prevState: ModelFormState, formData: FormData): Promise<ModelFormState> {
  const values = readValues(formData);
  const force = formData.get("force") === "true";

  if (!values.seriesId || !values.model) {
    return { status: "error", message: "Select a series and enter a model name.", values };
  }

  if (!force) {
    const existing = await findDuplicateModel(values.seriesId, values.model, toInt(values.generationYear));
    if (existing) {
      return { status: "duplicate", duplicate: { id: existing.id, label: racketLabel(racketLabelParts(existing)) }, values };
    }
  }

  const created = await createModel(toInput(values));
  revalidatePath("/catalogue");
  redirect(`/catalogue/models/${created.id}`);
}

export async function updateModelAction(modelId: string, prevState: ModelFormState, formData: FormData): Promise<ModelFormState> {
  const values = readValues(formData);
  const force = formData.get("force") === "true";

  if (!values.seriesId || !values.model) {
    return { status: "error", message: "Select a series and enter a model name.", values };
  }

  if (!force) {
    const existing = await findDuplicateModel(values.seriesId, values.model, toInt(values.generationYear), modelId);
    if (existing) {
      return { status: "duplicate", duplicate: { id: existing.id, label: racketLabel(racketLabelParts(existing)) }, values };
    }
  }

  await updateModel(modelId, toInput(values));
  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/models/${modelId}`);
  redirect(`/catalogue/models/${modelId}`);
}

export async function archiveModelAction(modelId: string, archived: boolean) {
  await setModelArchived(modelId, archived);
  revalidatePath("/catalogue");
  revalidatePath(`/catalogue/models/${modelId}`);
}

// -- brand / series management (src/app/catalogue/brands/page.tsx) --------

export async function createBrandAction(name: string) {
  const brand = await createBrand(name);
  revalidatePath("/catalogue/brands");
  return brand;
}

export async function renameBrandAction(id: string, name: string) {
  await renameBrand(id, name);
  revalidatePath("/catalogue/brands");
}

export async function archiveBrandAction(id: string, archived: boolean) {
  await setBrandArchived(id, archived);
  revalidatePath("/catalogue/brands");
}

export async function createSeriesAction(brandId: string, name: string) {
  const series = await createSeries(brandId, name);
  revalidatePath("/catalogue/brands");
  return series;
}

export async function renameSeriesAction(id: string, name: string) {
  await renameSeries(id, name);
  revalidatePath("/catalogue/brands");
}

export async function archiveSeriesAction(id: string, archived: boolean) {
  await setSeriesArchived(id, archived);
  revalidatePath("/catalogue/brands");
}
