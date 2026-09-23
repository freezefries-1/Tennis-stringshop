"use client";

import { useState } from "react";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Button } from "@/components/ds/button";
import { Icon } from "@/components/ds/icon";
import { formatCents } from "@/lib/format";
import { COMMON_SERVICES, type ServiceLineValues } from "@/lib/job-form-types";

const CUSTOM_SENTINEL = "__custom__";

function lineTotalCents(line: ServiceLineValues): number {
  const qty = Number.parseFloat(line.quantity) || 1;
  const unit = Math.round((Number.parseFloat(line.unitPrice) || 0) * 100);
  return Math.round(unit * qty);
}

function selectStyle(): React.CSSProperties {
  return { height: 38, padding: "0 12px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", background: "var(--paper-000)", fontFamily: "var(--font-body)", fontSize: 15, width: "100%" };
}

/** A real dropdown of the common service names, with a "Custom…" option
 * that reveals a free-text field — not every line is one of the six
 * common ones (a one-off note, a typo-fixed name from an old job, …), so
 * typing is never blocked, just not the default path. Local customMode
 * state (not derived purely from serviceName) so picking "Custom…" with
 * nothing typed yet still shows the text field instead of snapping back
 * to the placeholder. */
function ServiceNameField({ value, onChange, fieldId }: { value: string; onChange: (v: string) => void; fieldId: string }) {
  const [customMode, setCustomMode] = useState(() => value !== "" && !COMMON_SERVICES.includes(value));

  if (customMode) {
    return (
      <Field label="Service" style={{ flex: "1 1 160px", minWidth: 0 }} htmlFor={fieldId}>
        <Input id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type a service name" style={{ width: "100%", minWidth: 0 }} />
      </Field>
    );
  }

  return (
    <Field label="Service" style={{ flex: "1 1 160px", minWidth: 0 }} htmlFor={fieldId}>
      <select
        id={fieldId}
        value={COMMON_SERVICES.includes(value) ? value : ""}
        onChange={(e) => {
          if (e.target.value === CUSTOM_SENTINEL) {
            setCustomMode(true);
            onChange("");
          } else {
            onChange(e.target.value);
          }
        }}
        style={selectStyle()}
      >
        <option value="" disabled>
          Select a service…
        </option>
        {COMMON_SERVICES.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={CUSTOM_SENTINEL}>Custom…</option>
      </select>
    </Field>
  );
}

export function ServicesEditor({ services, onChange }: { services: ServiceLineValues[]; onChange: (services: ServiceLineValues[]) => void }) {
  const update = (i: number, patch: Partial<ServiceLineValues>) => {
    onChange(services.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  };
  const remove = (i: number) => onChange(services.filter((_, idx) => idx !== i));
  const add = () => onChange([...services, { serviceName: "", quantity: "1", unitPrice: "", notes: "" }]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {services.map((s, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <ServiceNameField value={s.serviceName} onChange={(v) => update(i, { serviceName: v })} fieldId={`service-name-${i}`} />
            <Field label="Qty" style={{ width: 64, minWidth: 0 }}>
              <Input type="number" inputMode="decimal" min="0" step="0.5" value={s.quantity} onChange={(e) => update(i, { quantity: e.target.value })} style={{ width: "100%", minWidth: 0 }} />
            </Field>
            <Field label="Unit price" style={{ width: 90, minWidth: 0 }}>
              <Input type="number" inputMode="decimal" min="0" step="0.01" value={s.unitPrice} onChange={(e) => update(i, { unitPrice: e.target.value })} placeholder="0.00" style={{ width: "100%", minWidth: 0 }} />
            </Field>
            <div className="num" style={{ minWidth: 60, textAlign: "right", paddingBottom: 9, fontSize: 14.5 }}>
              {formatCents(lineTotalCents(s))}
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${s.serviceName || "service"}`}
              style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer", paddingBottom: 9 }}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
          <Input value={s.notes} onChange={(e) => update(i, { notes: e.target.value })} placeholder="Optional note for this line" style={{ width: "100%" }} />
        </div>
      ))}
      <Button type="button" size="sm" variant="ghost" iconLeft="plus" onClick={add} style={{ alignSelf: "flex-start" }}>
        Add service
      </Button>
    </div>
  );
}

export { lineTotalCents };
