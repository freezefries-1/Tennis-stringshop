"use client";

import { useState } from "react";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";

const QUICK = ["2", "4"];

/** Number of knots stores as a real integer (brief §14: never just the
 * display text "4 knots") — the quick buttons just prefill the same numeric
 * input "Other" uses, so there's only ever one source of truth. */
export function KnotsSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [customOpen, setCustomOpen] = useState(!!value && !QUICK.includes(value));

  return (
    <Field label="Number of knots">
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs-lite">
          {QUICK.map((n) => (
            <button
              key={n}
              type="button"
              className={"tab-lite" + (value === n && !customOpen ? " on" : "")}
              onClick={() => {
                setCustomOpen(false);
                onChange(n);
              }}
            >
              {n} knots
            </button>
          ))}
          <button
            type="button"
            className={"tab-lite" + (customOpen ? " on" : "")}
            onClick={() => {
              setCustomOpen(true);
              onChange("");
            }}
          >
            Other
          </button>
        </div>
        {customOpen ? (
          <Input
            type="number"
            min={0}
            placeholder="e.g. 6"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: 90 }}
            autoFocus
          />
        ) : null}
      </div>
    </Field>
  );
}
