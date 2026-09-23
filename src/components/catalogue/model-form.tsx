"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Combobox } from "@/components/ds/combobox";
import {
  fetchBrands,
  fetchSeriesForBrand,
  quickCreateBrand,
  quickCreateSeries,
  type RacketBrand,
  type RacketSeries,
} from "@/components/customers/racket-picker-actions";
import type { ModelFormState } from "@/lib/model-form-types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function ModelForm({
  action,
  initialState,
  initialBrand = null,
  initialSeries = null,
  submitLabel,
}: {
  action: (state: ModelFormState, formData: FormData) => Promise<ModelFormState>;
  initialState: ModelFormState;
  initialBrand?: RacketBrand | null;
  initialSeries?: RacketSeries | null;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);
  const v = state.values;

  const [brands, setBrands] = useState<RacketBrand[]>([]);
  const [series, setSeries] = useState<RacketSeries[]>([]);
  const [brand, setBrand] = useState<RacketBrand | null>(initialBrand);
  const [selectedSeries, setSelectedSeries] = useState<RacketSeries | null>(initialSeries);
  const [showNewBrand, setShowNewBrand] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [showNewSeries, setShowNewSeries] = useState<string | null>(null);
  const [newSeriesName, setNewSeriesName] = useState("");

  useEffect(() => {
    fetchBrands().then(setBrands);
  }, []);
  useEffect(() => {
    if (!brand) return;
    fetchSeriesForBrand(brand.id).then(setSeries);
  }, [brand]);

  return (
    <form action={formAction} className="form" style={{ maxWidth: 640 }}>
      {state.status === "duplicate" && state.duplicate ? (
        <div className="form-warning">
          <p>
            A model matching this already exists: <strong>{state.duplicate.label}</strong>.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/catalogue/models/${state.duplicate.id}`}>
              <Button type="button" size="sm" variant="secondary">
                View existing model
              </Button>
            </Link>
            <Button type="submit" name="force" value="true" size="sm">
              Create anyway
            </Button>
          </div>
        </div>
      ) : null}
      {state.status === "error" ? (
        <div className="form-warning">
          <p>{state.message}</p>
        </div>
      ) : null}

      <input type="hidden" name="seriesId" value={selectedSeries?.id ?? ""} />

      <div className="form-grid">
        <Combobox
          label="Brand"
          placeholder="Yonex, Wilson, Head…"
          options={brands}
          getLabel={(b) => b.name}
          getKey={(b) => b.id}
          selected={brand}
          addNewLabel="Add brand"
          onSelect={(b) => {
            setBrand(b);
            setSelectedSeries(null);
          }}
          onAddNew={(q) => {
            setShowNewBrand(q);
            setNewBrandName(q);
          }}
        />
        <Combobox
          label="Series"
          placeholder={brand ? "EZONE, Blade…" : "Select a brand first"}
          options={brand ? series : []}
          getLabel={(s) => s.name}
          getKey={(s) => s.id}
          selected={selectedSeries}
          disabled={!brand}
          addNewLabel="Add series"
          onSelect={setSelectedSeries}
          onAddNew={(q) => {
            setShowNewSeries(q);
            setNewSeriesName(q);
          }}
        />
      </div>

      {showNewBrand !== null ? (
        <div className="form-grid" style={{ alignItems: "flex-end" }}>
          <Field label="New brand name">
            <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="button"
              size="sm"
              disabled={!newBrandName.trim()}
              onClick={async () => {
                const created = await quickCreateBrand(newBrandName);
                setBrands((prev) => (prev.some((b) => b.id === created.id) ? prev : [...prev, created]));
                setBrand(created);
                setSelectedSeries(null);
                setShowNewBrand(null);
              }}
            >
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewBrand(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {showNewSeries !== null && brand ? (
        <div className="form-grid" style={{ alignItems: "flex-end" }}>
          <Field label={`New series under ${brand.name}`}>
            <Input value={newSeriesName} onChange={(e) => setNewSeriesName(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="button"
              size="sm"
              disabled={!newSeriesName.trim()}
              onClick={async () => {
                const created = await quickCreateSeries(brand.id, newSeriesName);
                setSeries((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created]));
                setSelectedSeries(created);
                setShowNewSeries(null);
              }}
            >
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewSeries(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {selectedSeries ? (
        <>
          <div className="form-grid">
            <Field label="Model" required htmlFor="model">
              <Input id="model" name="model" defaultValue={v.model} placeholder="100" required style={{ width: "100%" }} />
            </Field>
            <Field label="Release year" htmlFor="generationYear">
              <Input id="generationYear" name="generationYear" type="number" defaultValue={v.generationYear} placeholder="2025" style={{ width: "100%" }} />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Generation name" htmlFor="generationName" hint="e.g. 8th Gen, V9">
              <Input id="generationName" name="generationName" defaultValue={v.generationName} style={{ width: "100%" }} />
            </Field>
            <Field label="Head size (sq in)" htmlFor="headSizeSqin">
              <Input id="headSizeSqin" name="headSizeSqin" defaultValue={v.headSizeSqin} placeholder="100" style={{ width: "100%" }} />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="String pattern — mains" htmlFor="stringPatternMains">
              <Input id="stringPatternMains" name="stringPatternMains" type="number" defaultValue={v.stringPatternMains} placeholder="16" style={{ width: "100%" }} />
            </Field>
            <Field label="String pattern — crosses" htmlFor="stringPatternCrosses">
              <Input id="stringPatternCrosses" name="stringPatternCrosses" type="number" defaultValue={v.stringPatternCrosses} placeholder="19" style={{ width: "100%" }} />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Standard weight (g)" htmlFor="unstrungWeightG">
              <Input id="unstrungWeightG" name="unstrungWeightG" type="number" defaultValue={v.unstrungWeightG} placeholder="300" style={{ width: "100%" }} />
            </Field>
            <Field label="Standard balance (mm)" htmlFor="standardBalanceMm">
              <Input id="standardBalanceMm" name="standardBalanceMm" type="number" defaultValue={v.standardBalanceMm} placeholder="320" style={{ width: "100%" }} />
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Length (in)" htmlFor="standardLengthIn">
              <Input id="standardLengthIn" name="standardLengthIn" defaultValue={v.standardLengthIn} placeholder="27" style={{ width: "100%" }} />
            </Field>
            <Field label="Recommended tension (lbs)" htmlFor="recommendedTensionMinLbs">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input id="recommendedTensionMinLbs" name="recommendedTensionMinLbs" defaultValue={v.recommendedTensionMinLbs} placeholder="48" style={{ width: "100%" }} />
                <span className="num" style={{ color: "var(--ink-400)" }}>–</span>
                <Input name="recommendedTensionMaxLbs" defaultValue={v.recommendedTensionMaxLbs} placeholder="58" style={{ width: "100%" }} />
              </div>
            </Field>
          </div>
          <div className="form-grid">
            <Field label="Recommended full bed length" htmlFor="recommendedFullBedLengthM" hint="Optional — used to suggest usage on new full-bed jobs for this racket">
              <Input id="recommendedFullBedLengthM" name="recommendedFullBedLengthM" type="number" step="0.1" defaultValue={v.recommendedFullBedLengthM} placeholder="e.g. 10.8" suffix="m" style={{ width: "100%" }} />
            </Field>
            <div />
          </div>
          <div className="form-grid">
            <Field label="Recommended main length" htmlFor="recommendedMainLengthM" hint="Optional — hybrid/two-piece jobs">
              <Input id="recommendedMainLengthM" name="recommendedMainLengthM" type="number" step="0.1" defaultValue={v.recommendedMainLengthM} placeholder="e.g. 5.8" suffix="m" style={{ width: "100%" }} />
            </Field>
            <Field label="Recommended cross length" htmlFor="recommendedCrossLengthM" hint="Optional — hybrid/two-piece jobs">
              <Input id="recommendedCrossLengthM" name="recommendedCrossLengthM" type="number" step="0.1" defaultValue={v.recommendedCrossLengthM} placeholder="e.g. 5.0" suffix="m" style={{ width: "100%" }} />
            </Field>
          </div>
          <Field label="Notes" htmlFor="notes">
            <textarea id="notes" name="notes" defaultValue={v.notes} />
          </Field>

          <div className="form-actions">
            <SubmitButton label={submitLabel} />
          </div>
        </>
      ) : (
        <div className="row-s" style={{ marginTop: 4 }}>
          Select a brand and series above to continue.
        </div>
      )}
    </form>
  );
}
