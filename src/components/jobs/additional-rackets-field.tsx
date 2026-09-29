"use client";

import { RacketPicker } from "./racket-picker";
import { Button } from "@/components/ds/button";
import { racketLabel } from "@/lib/racket-label";
import type { RacketWithSpecs } from "@/lib/rackets";

function racketChipLabel(r: RacketWithSpecs): string {
  const label = racketLabel({
    brand: r.effectiveBrand,
    series: r.effectiveSeries,
    model: r.effectiveModel,
    generationYear: r.effectiveGenerationYear,
    generationName: r.effectiveGenerationName,
  });
  return [r.code, label, r.nickname].filter(Boolean).join(" · ");
}

/** Lets one string setup/services/notes fill-in below become several
 * independent String Jobs at once — e.g. a customer brings 3 rackets and
 * wants the identical setup on all of them, instead of re-entering the
 * same form 3 times. Each racket added here becomes its own job on submit
 * (own code, own stock deduction, own entry in that racket's own stringing
 * history) — this widget only collects which extra rackets to duplicate
 * into; createJobAction does the actual duplicating. Create mode only, and
 * only once a primary racket is picked (there's nothing to duplicate yet
 * otherwise). */
export function AdditionalRacketsField({
  customerId,
  primaryRacketId,
  value,
  onChange,
}: {
  customerId: string;
  primaryRacketId: string;
  value: RacketWithSpecs[];
  onChange: (rackets: RacketWithSpecs[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="lab">Also string this same setup for</div>
      <div className="row-s">Optional — string 2–3 rackets the same way in one go, without retyping the setup.</div>
      {value.length ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {value.map((r) => (
            <div className="row" key={r.id}>
              <div className="row-main">
                <div className="row-t">{racketChipLabel(r)}</div>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(value.filter((v) => v.id !== r.id))}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      ) : null}
      <RacketPicker
        customerId={customerId}
        selected={null}
        excludeIds={[primaryRacketId, ...value.map((r) => r.id)]}
        onSelect={(r) => {
          if (r) onChange([...value, r]);
        }}
      />
    </div>
  );
}
