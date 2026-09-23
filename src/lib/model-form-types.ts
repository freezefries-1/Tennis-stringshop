// Plain types + initial state for the racket-model form. Kept out of
// src/app/catalogue/actions.ts because a "use server" module may only
// export async functions.
export interface ModelFormValues {
  seriesId: string;
  model: string;
  generationYear: string;
  generationName: string;
  headSizeSqin: string;
  stringPatternMains: string;
  stringPatternCrosses: string;
  unstrungWeightG: string;
  standardBalanceMm: string;
  standardLengthIn: string;
  recommendedTensionMinLbs: string;
  recommendedTensionMaxLbs: string;
  recommendedFullBedLengthM: string;
  recommendedMainLengthM: string;
  recommendedCrossLengthM: string;
  notes: string;
}

export interface ModelFormState {
  status: "idle" | "duplicate" | "error";
  message?: string;
  duplicate?: { id: string; label: string };
  values: ModelFormValues;
}

export const emptyModelFormState: ModelFormState = {
  status: "idle",
  values: {
    seriesId: "",
    model: "",
    generationYear: "",
    generationName: "",
    headSizeSqin: "",
    stringPatternMains: "",
    stringPatternCrosses: "",
    unstrungWeightG: "",
    standardBalanceMm: "",
    standardLengthIn: "",
    recommendedTensionMinLbs: "",
    recommendedTensionMaxLbs: "",
    recommendedFullBedLengthM: "",
    recommendedMainLengthM: "",
    recommendedCrossLengthM: "",
    notes: "",
  },
};
