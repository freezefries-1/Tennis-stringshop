import type { HTMLAttributes } from "react";

type ProgressTone = "brand" | "accent" | "warning" | "danger";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  label?: string;
  valueLabel?: string;
  tone?: ProgressTone;
  height?: number;
}

const FILL: Record<ProgressTone, string> = {
  brand: "var(--court-600)",
  accent: "var(--optic-500)",
  warning: "var(--signal-warning)",
  danger: "var(--signal-danger)",
};

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  tone = "brand",
  height = 6,
  style,
  ...rest
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, ...style }} {...rest}>
      {label || valueLabel ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label)",
              letterSpacing: "var(--ls-label)",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {label}
          </span>
          {valueLabel ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-mono-s)",
                color: "var(--text-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {valueLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      <div style={{ height, borderRadius: "var(--radius-pill)", background: "var(--ink-100)", overflow: "hidden" }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: FILL[tone],
            borderRadius: "var(--radius-pill)",
            transition: "width var(--duration-base) var(--ease-standard)",
          }}
        />
      </div>
    </div>
  );
}
