import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "./icon";

type DeltaTone = "up" | "down" | "neutral";

export interface StatBlockProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  deltaTone?: DeltaTone;
  icon?: string;
}

const DELTA_COLORS: Record<DeltaTone, string> = {
  up: "var(--signal-success)",
  down: "var(--signal-danger)",
  neutral: "var(--ink-400)",
};

export function StatBlock({ label, value, unit, delta, deltaTone = "neutral", icon, style, ...rest }: StatBlockProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, ...style }} {...rest}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        {icon ? <Icon name={icon} size={14} color="var(--ink-400)" /> : null}
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
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-display-m)",
            lineHeight: 1,
            letterSpacing: "var(--ls-display-m)",
            fontWeight: "var(--weight-semibold)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--text-primary)",
          }}
        >
          {value}
        </span>
        {unit ? (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-m)", color: "var(--text-muted)" }}>
            {unit}
          </span>
        ) : null}
        {delta ? (
          <span style={{ marginLeft: 2, fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-s)", color: DELTA_COLORS[deltaTone] }}>
            {delta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
