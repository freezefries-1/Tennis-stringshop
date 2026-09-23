"use client";

import { useState } from "react";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { saveStringUsageDefaultsAction, saveInventoryDefaultsAction } from "@/app/settings/actions";
import { PatternDefaultsManager } from "./pattern-defaults-manager";
import type { InventoryDefaults, StringUsageDefaults } from "@/lib/settings";
import type { StringPatternDefault } from "@/lib/string-usage";

function NumField({ label, hint, value, onChange, suffix }: { label: string; hint?: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input type="number" inputMode="decimal" min="0" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} suffix={suffix} style={{ width: 140 }} />
    </Field>
  );
}

export function SettingsView({ stringUsage, inventory, patternDefaults }: { stringUsage: StringUsageDefaults; inventory: InventoryDefaults; patternDefaults: StringPatternDefault[] }) {
  const [usage, setUsage] = useState({ fullBedUsageM: String(stringUsage.fullBedUsageM), mainUsageM: String(stringUsage.mainUsageM), crossUsageM: String(stringUsage.crossUsageM) });
  const [inv, setInv] = useState({
    lowStockThresholdM: String(inventory.lowStockThresholdM),
    lowStockThresholdSets: String(inventory.lowStockThresholdSets),
    lowStockThresholdUnits: String(inventory.lowStockThresholdUnits),
  });
  const [savingUsage, setSavingUsage] = useState(false);
  const [savingInv, setSavingInv] = useState(false);
  const [savedUsage, setSavedUsage] = useState(false);
  const [savedInv, setSavedInv] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="lab">String usage — global default</div>
          <p className="row-s" style={{ marginTop: 4 }}>
            Pre-fills the length used on a new string job when nothing more specific applies — still fully editable per job. A racket&rsquo;s own recommended length (set on its catalogue model) wins over its string pattern&rsquo;s default below, which in turn wins over this.
          </p>
        </div>
        <div className="form-grid">
          <NumField label="Default full bed usage" value={usage.fullBedUsageM} onChange={(v) => setUsage((u) => ({ ...u, fullBedUsageM: v }))} suffix="m" />
          <div />
          <NumField label="Default main usage" value={usage.mainUsageM} onChange={(v) => setUsage((u) => ({ ...u, mainUsageM: v }))} suffix="m" />
          <NumField label="Default cross usage" value={usage.crossUsageM} onChange={(v) => setUsage((u) => ({ ...u, crossUsageM: v }))} suffix="m" />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button
            type="button"
            size="sm"
            disabled={savingUsage}
            onClick={async () => {
              setSavingUsage(true);
              setSavedUsage(false);
              await saveStringUsageDefaultsAction({
                fullBedUsageM: Number(usage.fullBedUsageM) || 0,
                mainUsageM: Number(usage.mainUsageM) || 0,
                crossUsageM: Number(usage.crossUsageM) || 0,
              });
              setSavingUsage(false);
              setSavedUsage(true);
            }}
          >
            {savingUsage ? "Saving…" : "Save"}
          </Button>
          {savedUsage ? <span className="row-s">Saved.</span> : null}
        </div>
      </Card>

      <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="lab">String usage — by string pattern</div>
          <p className="row-s" style={{ marginTop: 4 }}>
            A more specific default than the global one above, matched against a racket&rsquo;s string pattern (16x19, 18x20, ...). A racket&rsquo;s own recommended length (on its catalogue model) still takes priority over this when set.
          </p>
        </div>
        <PatternDefaultsManager initialRows={patternDefaults} />
      </Card>

      <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="lab">Inventory defaults</div>
          <p className="row-s" style={{ marginTop: 4 }}>
            Applied to any string or retail product that doesn&rsquo;t set its own low-stock threshold.
          </p>
        </div>
        <div className="form-grid">
          <NumField label="Low stock threshold (reels)" value={inv.lowStockThresholdM} onChange={(v) => setInv((u) => ({ ...u, lowStockThresholdM: v }))} suffix="m" />
          <NumField label="Low stock threshold (sets)" value={inv.lowStockThresholdSets} onChange={(v) => setInv((u) => ({ ...u, lowStockThresholdSets: v }))} suffix="sets" />
          <NumField label="Low stock threshold (products)" value={inv.lowStockThresholdUnits} onChange={(v) => setInv((u) => ({ ...u, lowStockThresholdUnits: v }))} suffix="units" />
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button
            type="button"
            size="sm"
            disabled={savingInv}
            onClick={async () => {
              setSavingInv(true);
              setSavedInv(false);
              await saveInventoryDefaultsAction({
                lowStockThresholdM: Number(inv.lowStockThresholdM) || 0,
                lowStockThresholdSets: Number(inv.lowStockThresholdSets) || 0,
                lowStockThresholdUnits: Number(inv.lowStockThresholdUnits) || 0,
              });
              setSavingInv(false);
              setSavedInv(true);
            }}
          >
            {savingInv ? "Saving…" : "Save"}
          </Button>
          {savedInv ? <span className="row-s">Saved.</span> : null}
        </div>
      </Card>

      <Card padding="20px" tone="sunken">
        <div className="lab" style={{ marginBottom: 6 }}>
          Coming later
        </div>
        <p className="row-s">Business name and currency, payment methods, expense categories, and CSV backup scheduling are still on the phase plan.</p>
      </Card>
    </div>
  );
}
