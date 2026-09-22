"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRacket, getRacket, linkRacketToModel, setRacketArchived, updateRacket, type RacketInput } from "@/lib/rackets";
import { createModel, findDuplicateModel, racketLabelParts, type RacketModelInput } from "@/lib/racket-catalogue";
import { quickCreateBrand, quickCreateSeries } from "@/components/customers/racket-picker-actions";
import { racketLabel } from "@/lib/racket-label";
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

// -- promoting a manually-entered racket into the master racket database ---

export interface PromoteRacketResult {
  status: "linked" | "duplicate" | "error";
  message?: string;
  existing?: { id: string; label: string };
  modelId?: string;
}

/** Best-effort parse of the manual/free-text string pattern ("16x19",
 * "16 × 19") into the catalogue's structured mains/crosses columns. Left
 * null (not guessed) when it doesn't match — nothing forces this field on a
 * master model. */
function parseStringPattern(input: string | null): { mains: number | null; crosses: number | null } {
  const match = input?.match(/^\s*(\d{1,2})\s*[x×X]\s*(\d{1,2})\s*$/);
  if (!match) return { mains: null, crosses: null };
  return { mains: Number.parseInt(match[1], 10), crosses: Number.parseInt(match[2], 10) };
}

function afterLink(customerId: string, racketId: string, modelId: string): PromoteRacketResult {
  revalidatePath(`/customers/${customerId}/rackets/${racketId}`);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/catalogue");
  return { status: "linked", modelId };
}

/** Turns a manually-entered racket's brand/series/model text into a real
 * catalogue entry (reusing an existing brand/series by name, same as the
 * racket form's inline quick-create) and links this racket to it. The
 * racket's own manual columns are left as-is — see linkRacketToModel. */
export async function promoteRacketToModelAction(customerId: string, racketId: string, force = false): Promise<PromoteRacketResult> {
  const found = await getRacket(racketId);
  if (!found) return { status: "error", message: "Racket not found." };
  const { racket } = found;

  if (racket.racketModelId) return { status: "error", message: "This racket is already linked to a racket model." };

  const brandName = racket.brand?.trim();
  const seriesName = racket.series?.trim();
  const modelName = racket.model?.trim();
  if (!brandName || !seriesName || !modelName) {
    return { status: "error", message: "Brand, series and model must all be filled in (edit the racket first) before it can be added to the database." };
  }

  const brand = await quickCreateBrand(brandName);
  const series = await quickCreateSeries(brand.id, seriesName);

  if (!force) {
    const existing = await findDuplicateModel(series.id, modelName, racket.generationYear ?? null);
    if (existing) {
      return { status: "duplicate", existing: { id: existing.id, label: racketLabel(racketLabelParts(existing)) } };
    }
  }

  const { mains, crosses } = parseStringPattern(racket.stringPattern);
  const input: RacketModelInput = {
    seriesId: series.id,
    model: modelName,
    generationYear: racket.generationYear ?? null,
    headSizeSqin: racket.headSizeSqin ?? null,
    stringPatternMains: mains,
    stringPatternCrosses: crosses,
  };
  const model = await createModel(input);
  await linkRacketToModel(racketId, model.id);
  return afterLink(customerId, racketId, model.id);
}

/** Duplicate-resolution counterpart to promoteRacketToModelAction: link to
 * the existing model the duplicate check found, instead of creating a new
 * one. */
export async function linkRacketToExistingModelAction(customerId: string, racketId: string, modelId: string): Promise<PromoteRacketResult> {
  const row = await linkRacketToModel(racketId, modelId);
  if (!row) return { status: "error", message: "Racket not found." };
  return afterLink(customerId, racketId, modelId);
}

// -- archiving a customer racket (removes it from the customer's active
// portfolio and from racket selectors, without deleting its history) -------

export async function archiveRacketAction(customerId: string, racketId: string, archived: boolean) {
  await setRacketArchived(racketId, archived);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/customers/${customerId}/rackets/${racketId}`);
}
