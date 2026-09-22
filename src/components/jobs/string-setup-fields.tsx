"use client";

import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import type { StringLineValues } from "@/lib/job-form-types";

function unitSelect(value: "kg" | "lb", onChange: (v: "kg" | "lb") => void) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "kg" | "lb")}
      style={{ height: 38, padding: "0 10px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 14 }}
    >
      <option value="lb">lbs</option>
      <option value="kg">kg</option>
    </select>
  );
}

function TensionField({ label, value, unit, onChange }: { label: string; value: string; unit: "kg" | "lb"; onChange: (tension: string, unit: "kg" | "lb") => void }) {
  return (
    <Field label={label}>
      <div style={{ display: "flex", gap: 8 }}>
        <Input type="number" step="0.5" value={value} onChange={(e) => onChange(e.target.value, unit)} placeholder="50" style={{ width: "100%" }} />
        {unitSelect(unit, (u) => onChange(value, u))}
      </div>
    </Field>
  );
}

/** Brand/String/Gauge/Colour/Source for one string line — tension is
 * handled separately by the caller (see StringSetupSection) since a full
 * bed shares this block but still needs two independent tensions. */
function StringLineFields({ label, value, onChange, includeTension }: { label: string; value: StringLineValues; onChange: (patch: Partial<StringLineValues>) => void; includeTension?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="lab">{label}</div>
      <div className="form-grid">
        <Field label="Brand">
          <Input value={value.brand} onChange={(e) => onChange({ brand: e.target.value })} placeholder="Solinco" style={{ width: "100%" }} />
        </Field>
        <Field label="String">
          <Input value={value.stringName} onChange={(e) => onChange({ stringName: e.target.value })} placeholder="Hyper-G" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="form-grid">
        <Field label="Gauge (mm)">
          <Input value={value.gauge} onChange={(e) => onChange({ gauge: e.target.value })} placeholder="1.25" style={{ width: "100%" }} />
        </Field>
        <Field label="Colour">
          <Input value={value.colour} onChange={(e) => onChange({ colour: e.target.value })} placeholder="Green" style={{ width: "100%" }} />
        </Field>
      </div>
      <div className="tabs-lite" role="tablist">
        <button type="button" className={"tab-lite" + (!value.customerSupplied ? " on" : "")} onClick={() => onChange({ customerSupplied: false })}>
          SportCraft stock
        </button>
        <button type="button" className={"tab-lite" + (value.customerSupplied ? " on" : "")} onClick={() => onChange({ customerSupplied: true })}>
          Customer supplied
        </button>
      </div>
      {includeTension ? (
        <div className="form-grid">
          <TensionField label="Tension" value={value.tension} unit={value.tensionUnit} onChange={(tension, tensionUnit) => onChange({ tension, tensionUnit })} />
        </div>
      ) : null}
    </div>
  );
}

export function StringSetupSection({
  setupType,
  main,
  cross,
  onMainChange,
  onCrossChange,
}: {
  setupType: "full" | "hybrid";
  main: StringLineValues;
  cross: StringLineValues;
  onMainChange: (patch: Partial<StringLineValues>) => void;
  onCrossChange: (patch: Partial<StringLineValues>) => void;
}) {
  if (setupType === "hybrid") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <StringLineFields label="Main" value={main} onChange={onMainChange} includeTension />
        <StringLineFields label="Cross" value={cross} onChange={onCrossChange} includeTension />
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <StringLineFields label="String" value={main} onChange={onMainChange} />
      <div className="form-grid">
        <TensionField label="Main tension" value={main.tension} unit={main.tensionUnit} onChange={(tension, tensionUnit) => onMainChange({ tension, tensionUnit })} />
        <TensionField label="Cross tension" value={cross.tension} unit={cross.tensionUnit} onChange={(tension, tensionUnit) => onCrossChange({ tension, tensionUnit })} />
      </div>
    </div>
  );
}
