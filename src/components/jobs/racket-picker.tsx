"use client";

import { useEffect, useState } from "react";
import { Combobox } from "@/components/ds/combobox";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { racketLabel } from "@/lib/racket-label";
import type { RacketWithSpecs } from "@/lib/rackets";
import { RacketModelPicker } from "@/components/customers/racket-model-picker";
import type { RacketModel } from "@/components/customers/racket-picker-actions";
import { fetchRacketsForCustomer, quickCreateRacketForJob } from "@/app/jobs/actions";

function racketOptionLabel(r: RacketWithSpecs): string {
  const label = racketLabel({
    brand: r.effectiveBrand,
    series: r.effectiveSeries,
    model: r.effectiveModel,
    generationYear: r.effectiveGenerationYear,
    generationName: r.effectiveGenerationName,
  });
  return [r.code, label, r.nickname].filter(Boolean).join(" · ");
}

/** Racket identity only (brand/series/model, optionally via the Phase 3
 * database) — measured specs (grip size, weight, ...) are skipped here for
 * speed and can be filled in later from the racket's own profile; this is
 * the "New String Job" fast path, not the full Add Racket form. */
function QuickAddRacket({ customerId, onCreated, onCancel }: { customerId: string; onCreated: (racketId: string) => void; onCancel: () => void }) {
  const [mode, setMode] = useState<"database" | "manual">("database");
  const [model, setModel] = useState<RacketModel | null>(null);
  const [nickname, setNickname] = useState("");
  const [brand, setBrand] = useState("");
  const [series, setSeries] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = mode === "database" ? !!model : !!(brand.trim() || series.trim() || manualModel.trim());

  return (
    <Card tone="sunken" padding="16px" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="lab">Add racket</div>
      <div className="tabs-lite" role="tablist">
        <button type="button" className={"tab-lite" + (mode === "database" ? " on" : "")} onClick={() => setMode("database")}>
          From racket database
        </button>
        <button type="button" className={"tab-lite" + (mode === "manual" ? " on" : "")} onClick={() => setMode("manual")}>
          Manual entry
        </button>
      </div>
      {mode === "database" ? (
        <RacketModelPicker initialModel={null} onModelChange={setModel} />
      ) : (
        <div className="form-grid">
          <Field label="Brand">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Yonex" style={{ width: "100%" }} />
          </Field>
          <Field label="Series">
            <Input value={series} onChange={(e) => setSeries(e.target.value)} placeholder="EZONE" style={{ width: "100%" }} />
          </Field>
          <Field label="Model">
            <Input value={manualModel} onChange={(e) => setManualModel(e.target.value)} placeholder="100" style={{ width: "100%" }} />
          </Field>
        </div>
      )}
      <Field label="Nickname" hint="Optional — helps tell identical rackets apart">
        <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Match racket #1" style={{ width: "100%" }} />
      </Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Button
          type="button"
          size="sm"
          disabled={saving || !canSave}
          onClick={async () => {
            setSaving(true);
            const created = await quickCreateRacketForJob(
              customerId,
              mode === "database" ? { racketModelId: model!.id, nickname: nickname || null } : { brand: brand || null, series: series || null, model: manualModel || null, nickname: nickname || null },
            );
            setSaving(false);
            onCreated(created.id);
          }}
        >
          {saving ? "Saving…" : "Save racket"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

export function RacketPicker({ customerId, selected, onSelect }: { customerId: string; selected: RacketWithSpecs | null; onSelect: (r: RacketWithSpecs | null) => void }) {
  const [rackets, setRackets] = useState<RacketWithSpecs[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickAdd, setQuickAdd] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRacketsForCustomer(customerId).then((r) => {
      if (!cancelled) {
        setRackets(r);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Combobox
        label="Racket"
        placeholder={loading ? "Loading…" : "Search racket ID, brand or model"}
        options={rackets ?? []}
        getLabel={racketOptionLabel}
        getKey={(r) => r.id}
        selected={selected}
        loading={loading}
        addNewLabel="Add racket"
        onSelect={onSelect}
        onAddNew={(q) => setQuickAdd(q)}
      />
      {rackets && rackets.length === 0 && !loading ? <div className="row-s">No rackets on file for this customer yet.</div> : null}
      {quickAdd !== null ? (
        <QuickAddRacket
          customerId={customerId}
          onCancel={() => setQuickAdd(null)}
          onCreated={async (racketId) => {
            setLoading(true);
            const fresh = await fetchRacketsForCustomer(customerId);
            setRackets(fresh);
            setLoading(false);
            onSelect(fresh.find((r) => r.id === racketId) ?? null);
            setQuickAdd(null);
          }}
        />
      ) : null}
    </div>
  );
}
