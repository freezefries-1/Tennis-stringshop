// Pure, framework/DB-agnostic — safe to import from Client Components.
// Lives apart from src/lib/rackets.ts (and racket-catalogue.ts) because
// those pull in the Postgres client, which must never end up in a browser
// bundle. Shared by customer rackets and master racket models — same shape.
export interface RacketLabelInput {
  brand?: string | null;
  series?: string | null;
  model?: string | null;
  generationYear?: number | null;
  generationName?: string | null;
}

/** "Yonex EZONE 100 (2025)" or, with a generation name in the mix,
 * "Wilson Blade 98 16x19 V9 (2024)" — brand + series + model + generation
 * name + year in parens, skipping whichever parts are blank (manual entry
 * doesn't require every field). */
export function racketLabel(r: RacketLabelInput): string {
  const parts = [r.brand, r.series, r.model].filter(Boolean);
  let base = parts.length ? parts.join(" ") : "Unnamed racket";
  if (r.generationName) base += ` ${r.generationName}`;
  return r.generationYear ? `${base} (${r.generationYear})` : base;
}

/** "16x19", "16 mains", "19 crosses", or null if neither is set. */
export function formatStringPattern(mains?: number | null, crosses?: number | null): string | null {
  if (mains == null && crosses == null) return null;
  if (mains != null && crosses != null) return `${mains}x${crosses}`;
  return mains != null ? `${mains} mains` : `${crosses} crosses`;
}
