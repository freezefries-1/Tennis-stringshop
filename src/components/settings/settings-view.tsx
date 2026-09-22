"use client";

import { useState } from "react";
import { Card } from "@/components/ds/card";
import { Field } from "@/components/ds/field";
import { Input } from "@/components/ds/input";
import { Button } from "@/components/ds/button";
import { saveStringUsageDefaultsAction, saveInventoryDefaultsAction } from "@/app/settings/actions";
import type { InventoryDefaults, StringUsageDefaults } from "@/lib/settings";

function NumField({ label, hint, value, onChange, suffix }: { label: string; hint?: string; value: string; onChange: (v: string) => void; suffix: string }) {
  return (
    <Field label={label} hint={hint}>
      <Input type="number" inputMode="decimal" min="0" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} suffix={suffix} style={{ width: 140 }} />
    </Field>
  );
}

export function SettingsView({ stringUsage, inventory }: { stringUsage: StringUsageDefaults; inventory: InventoryDefaults }) {
  const [usage, setUsage] = useState({ fullBedUsageM: String(stringUsage.fullBedUsageM), mainUsageM: String(stringUsage.mainUsageM), crossUsageM: String(stringUsage.crossUsageM) });
  const [inv, setInv] = useState({ lowStockThresholdM: String(inventory.lowStockThresholdM), lowStockThresholdSets: String(inventory.lowStockThresholdSets) });
  const [savingUsage, setSavingUsage] = useState(false);
  const [savingInv, setSavingInv] = useState(false);
  const [savedUsage, setSavedUsage] = useState(false);
  const [savedInv, setSavedInv] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <Card padding="20px" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div className="lab">String usage</div>
          <p className="row-s" style={{ marginTop: 4 }}>
            Pre-fills the length used on a new string job, so it doesn&rsquo;t need typing every time — still fully editable per job.
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
          <div className="lab">Inventory defaults</div>
          <p className="row-s" style={{ marginTop: 4 }}>
            Applied to any string product that doesn&rsquo;t set its own low-stock threshold.
          </p>
        </div>
        <div className="form-grid">
          <NumField label="Low stock threshold (reels)" value={inv.lowStockThresholdM} onChange={(v) => setInv((u) => ({ ...u, lowStockThresholdM: v }))} suffix="m" />
          <NumField label="Low stock threshold (sets)" value={inv.lowStockThresholdSets} onChange={(v) => setInv((u) => ({ ...u, lowStockThresholdSets: v }))} suffix="sets" />
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
