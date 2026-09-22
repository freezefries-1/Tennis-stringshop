"use server";

import {
  createBrand,
  createModel,
  createSeries,
  findBrandByName,
  findDuplicateModel,
  findSeriesByName,
  getModelWithNames,
  listBrands,
  listModelsForSeries,
  listSeriesForBrand,
  type RacketBrand,
  type RacketModel,
  type RacketModelInput,
  type RacketSeries,
} from "@/lib/racket-catalogue";

export type { RacketBrand, RacketModel, RacketSeries };

export async function fetchBrands(): Promise<RacketBrand[]> {
  return listBrands();
}

export async function fetchSeriesForBrand(brandId: string): Promise<RacketSeries[]> {
  return listSeriesForBrand(brandId);
}

export async function fetchModelsForSeries(seriesId: string): Promise<RacketModel[]> {
  return listModelsForSeries(seriesId);
}

/** Quick-create used by "+ Add brand" inline in the Add/Edit Racket form —
 * returns the existing brand instead of erroring on an exact-name repeat,
 * since that's almost always the user re-finding what's already there. */
export async function quickCreateBrand(name: string): Promise<RacketBrand> {
  const trimmed = name.trim();
  const existing = await findBrandByName(trimmed);
  if (existing) return existing;
  return createBrand(trimmed);
}

export async function quickCreateSeries(brandId: string, name: string): Promise<RacketSeries> {
  const trimmed = name.trim();
  const existing = await findSeriesByName(brandId, trimmed);
  if (existing) return existing;
  return createSeries(brandId, trimmed);
}

export interface QuickCreateModelResult {
  status: "created" | "duplicate";
  model: RacketModel;
}

/** Unlike brand/series, a near-duplicate model is a real soft-warn case
 * (see racket-catalogue.ts's findDuplicateModel) — different generations of
 * the same model legitimately share a name, so this returns the existing
 * row for confirmation rather than silently reusing or silently creating. */
export async function quickCreateModel(input: RacketModelInput, force: boolean): Promise<QuickCreateModelResult> {
  if (!force) {
    const existing = await findDuplicateModel(input.seriesId, input.model, input.generationYear ?? null);
    if (existing) return { status: "duplicate", model: existing };
  }
  const model = await createModel(input);
  return { status: "created", model };
}

export async function fetchModelWithNames(id: string) {
  return getModelWithNames(id);
}
