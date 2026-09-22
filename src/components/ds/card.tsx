"use client";

import { useState, type CSSProperties, type HTMLAttributes } from "react";

type CardTone = "default" | "sunken" | "brand" | "inverse";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: string;
  tone?: CardTone;
  interactive?: boolean;
}

const TONES: Record<CardTone, CSSProperties> = {
  default: { background: "var(--surface-card)", border: "1px solid var(--border-hairline)" },
  sunken: { background: "var(--surface-sunken)", border: "1px solid var(--border-hairline)" },
  brand: { background: "var(--surface-brand-soft)", border: "1px solid var(--court-200)" },
  inverse: {
    background: "var(--surface-inverse)",
    border: "1px solid var(--ink-800)",
    color: "var(--text-inverse)",
  },
};

export function Card({
  children,
  padding = "var(--space-3)",
  tone = "default",
  interactive = false,
  style,
  ...rest
}: CardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: "var(--radius-md)",
        padding,
        boxShadow: interactive && hover ? "var(--shadow-2)" : "var(--shadow-1)",
        borderColor: interactive && hover ? "var(--border-subtle)" : undefined,
        cursor: interactive ? "pointer" : undefined,
        transition:
          "box-shadow var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
        ...TONES[tone],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
