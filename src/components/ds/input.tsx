"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "./icon";

type InputSize = "sm" | "md" | "lg";

export interface DsInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  iconLeft?: string;
  suffix?: string;
  invalid?: boolean;
  size?: InputSize;
  /** Applied to the outer container (matches the design system's Input, whose
   *  `style` prop sizes the whole control, e.g. `{ width: "100%" }`). */
  style?: React.CSSProperties;
}

const HEIGHTS: Record<InputSize, number> = { sm: 32, md: 38, lg: 46 };

export function Input({
  iconLeft,
  suffix,
  invalid = false,
  disabled = false,
  size = "md",
  style,
  ...rest
}: DsInputProps) {
  const [focus, setFocus] = useState(false);
  const h = HEIGHTS[size] ?? HEIGHTS.md;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 160,
        height: h,
        padding: "0 12px",
        background: disabled ? "var(--ink-050)" : "var(--paper-000)",
        border: "1px solid " + (invalid ? "var(--signal-danger)" : focus ? "var(--court-500)" : "var(--border-subtle)"),
        borderRadius: "var(--radius-sm)",
        boxShadow: focus ? "0 0 0 3px rgba(21,107,82,0.12)" : "none",
        transition: "var(--transition-control)",
        ...style,
      }}
    >
      {iconLeft ? <Icon name={iconLeft} size={16} color="var(--ink-400)" /> : null}
      <input
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          fontFamily: "var(--font-body)",
          fontSize: size === "sm" ? "var(--text-body-s)" : "var(--text-body-m)",
          color: disabled ? "var(--ink-400)" : "var(--text-primary)",
        }}
        {...rest}
      />
      {suffix ? (
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-mono-s)", color: "var(--text-muted)", textTransform: "uppercase" }}>
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
