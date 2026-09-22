"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { Field } from "@/components/ds/field";
import { Card } from "@/components/ds/card";
import { Combobox } from "@/components/ds/combobox";
import { racketLabel, formatStringPattern } from "@/lib/racket-label";
import {
  fetchBrands,
  fetchModelsForSeries,
  fetchSeriesForBrand,
  quickCreateBrand,
  quickCreateModel,
  quickCreateSeries,
  type RacketBrand,
  type RacketModel,
  type RacketSeries,
} from "./racket-picker-actions";

function ModelQuickCreate({ seriesId, initialName, onCreated, onCancel }: { seriesId: string; initialName: string; onCreated: (m: RacketModel) => void; onCancel: () => void }) {
  const [model, setModel] = useState(initialName);
  const [generationYear, setGenerationYear] = useState("");
  const [headSizeSqin, setHeadSizeSqin] = useState("");
  const [mains, setMains] = useState("");
  const [crosses, setCrosses] = useState("");
  const [more, setMore] = useState(false);
  const [generationName, setGenerationName] = useState("");
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [duplicate, setDuplicate] = useState<RacketModel | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (force: boolean) => {
    if (!model.trim()) return;
    setSaving(true);
    const result = await quickCreateModel(
      {
        seriesId,
        model,
        generationYear: generationYear ? Number.parseInt(generationYear, 10) : null,
        generationName: generationName || null,
        headSizeSqin: headSizeSqin || null,
        stringPatternMains: mains ? Number.parseInt(mains, 10) : null,
        stringPatternCrosses: crosses ? Number.parseInt(crosses, 10) : null,
        unstrungWeightG: weight ? Number.parseInt(weight, 10) : null,
        notes: notes || null,
      },
      force,
    );
    setSaving(false);
    if (result.status === "duplicate") {
      setDuplicate(result.model);
      return;
    }
    onCreated(result.model);
  };

  return (
    <Card tone="sunken" padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="lab">Add racket model</div>
      {duplicate ? (
        <div className="form-warning">
          <p>
            A model matching this already exists: <strong>{racketLabel({ model: duplicate.model, generationYear: duplicate.generationYear, generationName: duplicate.generationName })}</strong>.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="button" size="sm" variant="secondary" onClick={() => onCreated(duplicate)}>
              Use existing
            </Button>
            <Button type="button" size="sm" onClick={() => submit(true)} disabled={saving}>
              Create anyway
            </Button>
          </div>
        </div>
      ) : null}
      <div className="form-grid">
        <Field label="Model" required>
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="100" style={{ width: "100%" }} />
        </Field>
        <Field label="Release year">
          <Input type="number" value={generationYear} onChange={(e) => setGenerationYear(e.target.value)} placeholder="2025" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Head size (sq in)">
          <Input value={headSizeSqin} onChange={(e) => setHeadSizeSqin(e.target.value)} placeholder="100" style={{ width: "100%" }} />
        </Field>
        <Field label="String pattern">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Input type="number" value={mains} onChange={(e) => setMains(e.target.value)} placeholder="16" style={{ width: "100%" }} />
            <span className="num" style={{ color: "var(--ink-400)" }}>×</span>
            <Input type="number" value={crosses} onChange={(e) => setCrosses(e.target.value)} placeholder="19" style={{ width: "100%" }} />
          </div>
        </Field>
      </div>
      {more ? (
        <>
          <div className="form-grid">
            <Field label="Generation name" hint="e.g. 8th Gen, V9">
              <Input value={generationName} onChange={(e) => setGenerationName(e.target.value)} style={{ width: "100%" }} />
            </Field>
            <Field label="Standard weight (g)">
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: "100%" }} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </>
      ) : (
        <button type="button" onClick={() => setMore(true)} style={{ alignSelf: "flex-start", border: "none", background: "none", color: "var(--court-600)", fontSize: 13, cursor: "pointer" }}>
          More specifications
        </button>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <Button type="button" size="sm" onClick={() => submit(false)} disabled={saving || !model.trim()}>
          {saving ? "Saving…" : "Save model"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

function NewNamePanel({ label, initialValue, onSave, onCancel }: { label: string; initialValue: string; onSave: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(initialValue);
  return (
    <Card tone="sunken" padding="12px 16px" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <Field label={label} style={{ flex: 1 }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
      </Field>
      <Button type="button" size="sm" onClick={() => name.trim() && onSave(name.trim())}>
        Save
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
    </Card>
  );
}

export function RacketModelPicker({ initialModel, onModelChange }: { initialModel: RacketModel | null; onModelChange: (m: RacketModel | null) => void }) {
  const [brands, setBrands] = useState<RacketBrand[]>([]);
  const [series, setSeries] = useState<RacketSeries[]>([]);
  const [models, setModels] = useState<RacketModel[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [brand, setBrand] = useState<RacketBrand | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<RacketSeries | null>(null);
  const [model, setModel] = useState<RacketModel | null>(initialModel);
  const [showNewBrand, setShowNewBrand] = useState<string | null>(null);
  const [showNewSeries, setShowNewSeries] = useState<string | null>(null);
  const [showNewModel, setShowNewModel] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands()
      .then(setBrands)
      .finally(() => setLoadingBrands(false));
  }, []);

  // The loading flag flips on in the selection handler (below, a plain
  // event handler — not an effect), not here: a set-state-in-effect lint
  // rule blocks setting it synchronously in the effect body itself.
  useEffect(() => {
    if (!brand) return;
    fetchSeriesForBrand(brand.id)
      .then(setSeries)
      .finally(() => setLoadingSeries(false));
  }, [brand]);

  useEffect(() => {
    if (!selectedSeries) return;
    fetchModelsForSeries(selectedSeries.id)
      .then(setModels)
      .finally(() => setLoadingModels(false));
  }, [selectedSeries]);

  useEffect(() => {
    onModelChange(model);
  }, [model, onModelChange]);

  const pickModel = (m: RacketModel | null) => {
    setModel(m);
    setShowNewModel(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="form-grid">
        <Combobox
          label="Brand"
          placeholder="Yonex, Wilson, Head…"
          options={brands}
          getLabel={(b) => b.name}
          getKey={(b) => b.id}
          selected={brand}
          loading={loadingBrands}
          addNewLabel="Add brand"
          onSelect={(b) => {
            setBrand(b);
            setSelectedSeries(null);
            setModel(null);
            setLoadingSeries(!!b);
          }}
          onAddNew={(q) => setShowNewBrand(q)}
        />
        <Combobox
          label="Series"
          placeholder={brand ? "EZONE, Blade…" : "Select a brand first"}
          options={brand ? series : []}
          getLabel={(s) => s.name}
          getKey={(s) => s.id}
          selected={selectedSeries}
          disabled={!brand}
          loading={loadingSeries}
          addNewLabel="Add series"
          onSelect={(s) => {
            setLoadingModels(!!s);
            setSelectedSeries(s);
            setModel(null);
          }}
          onAddNew={(q) => setShowNewSeries(q)}
        />
      </div>

      {showNewBrand !== null ? (
        <NewNamePanel
          label="New brand name"
          initialValue={showNewBrand}
          onCancel={() => setShowNewBrand(null)}
          onSave={async (name) => {
            const created = await quickCreateBrand(name);
            setBrands((prev) => (prev.some((b) => b.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))));
            setBrand(created);
            setSelectedSeries(null);
            setModel(null);
            setShowNewBrand(null);
          }}
        />
      ) : null}

      {showNewSeries !== null && brand ? (
        <NewNamePanel
          label={`New series under ${brand.name}`}
          initialValue={showNewSeries}
          onCancel={() => setShowNewSeries(null)}
          onSave={async (name) => {
            const created = await quickCreateSeries(brand.id, name);
            setSeries((prev) => (prev.some((s) => s.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name))));
            setSelectedSeries(created);
            setModel(null);
            setShowNewSeries(null);
          }}
        />
      ) : null}

      <Combobox
        label="Model"
        placeholder={selectedSeries ? "100, Blade 98 16x19…" : "Select a series first"}
        options={selectedSeries ? models : []}
        getLabel={(m) => racketLabel({ model: m.model, generationYear: m.generationYear, generationName: m.generationName })}
        getKey={(m) => m.id}
        selected={model}
        disabled={!selectedSeries}
        loading={loadingModels}
        addNewLabel="Add racket model"
        onSelect={pickModel}
        onAddNew={(q) => setShowNewModel(q)}
      />

      {showNewModel !== null && selectedSeries ? (
        <ModelQuickCreate seriesId={selectedSeries.id} initialName={showNewModel} onCreated={pickModel} onCancel={() => setShowNewModel(null)} />
      ) : null}

      {model ? (
        <Card tone="brand" padding="12px 16px">
          <div className="lab" style={{ marginBottom: 6 }}>
            Standard specifications
          </div>
          <div className="row-s num">
            {[
              model.headSizeSqin ? `${model.headSizeSqin} sq in` : null,
              formatStringPattern(model.stringPatternMains, model.stringPatternCrosses),
              model.unstrungWeightG ? `${model.unstrungWeightG} g` : null,
            ]
              .filter(Boolean)
              .join(" · ") || "No specifications recorded on this model yet."}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
