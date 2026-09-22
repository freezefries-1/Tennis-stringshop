// Plain types + initial state for the racket form. Kept out of
// src/app/customers/racket-actions.ts because a "use server" module may only
// export async functions — a plain object/interface export breaks the build.
export interface RacketFormValues {
  // "database" — racketModelId names the chosen catalogue model, the
  // manual fields below are ignored. "manual" — the reverse.
  mode: "database" | "manual";
  racketModelId: string;
  nickname: string;
  brand: string;
  series: string;
  model: string;
  generationYear: string;
  headSizeSqin: string;
  stringPattern: string;
  gripSize: string;
  staticWeightG: string;
  swingweight: string;
  balanceMm: string;
  customisationNotes: string;
  notes: string;
}

export interface RacketFormState {
  status: "idle" | "error";
  message?: string;
  values: RacketFormValues;
}

export const emptyRacketFormState: RacketFormState = {
  status: "idle",
  values: {
    mode: "database",
    racketModelId: "",
    nickname: "",
    brand: "",
    series: "",
    model: "",
    generationYear: "",
    headSizeSqin: "",
    stringPattern: "",
    gripSize: "",
    staticWeightG: "",
    swingweight: "",
    balanceMm: "",
    customisationNotes: "",
    notes: "",
  },
};
