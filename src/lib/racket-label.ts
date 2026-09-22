// Pure, framework/DB-agnostic — safe to import from Client Components.
// Lives apart from src/lib/rackets.ts because that module also pulls in the
// Postgres client, which must never end up in a browser bundle.
export interface RacketLabelInput {
  brand?: string | null;
  series?: string | null;
  model?: string | null;
  generationYear?: number | null;
}

/** "Yonex EZONE 100 (2025)" — brand + series + model + generation, skipping
 * whichever parts are blank (manual entry doesn't require every field). */
export function racketLabel(r: RacketLabelInput): string {
  const parts = [r.brand, r.series, r.model].filter(Boolean);
  const base = parts.length ? parts.join(" ") : "Unnamed racket";
  return r.generationYear ? `${base} (${r.generationYear})` : base;
}
