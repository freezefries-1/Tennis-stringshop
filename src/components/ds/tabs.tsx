"use client";

import { useState, type HTMLAttributes } from "react";

export interface TabItem {
  value: string;
  label: string;
  count?: number | null;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function Tabs({ items, value, defaultValue, onChange, style, ...rest }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.value);
  const [hover, setHover] = useState<string | null>(null);
  const current = value === undefined ? internal : value;
  const pick = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };
  return (
    <div role="tablist" style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border-hairline)", ...style }} {...rest}>
      {items.map((it) => {
        const on = current === it.value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => pick(it.value)}
            onMouseEnter={() => setHover(it.value)}
            onMouseLeave={() => setHover(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "0 12px",
              height: 38,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom: "2px solid " + (on ? "var(--court-600)" : "transparent"),
              marginBottom: -1,
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-m)",
              fontWeight: on ? "var(--weight-medium)" : "var(--weight-regular)",
              color: on ? "var(--text-primary)" : hover === it.value ? "var(--ink-700)" : "var(--text-muted)",
              transition: "var(--transition-control)",
            }}
          >
            {it.label}
            {it.count != null ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-s)",
                  color: on ? "var(--court-600)" : "var(--ink-400)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {it.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
