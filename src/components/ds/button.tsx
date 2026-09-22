"use client";

import { useState, type ButtonHTMLAttributes, type CSSProperties } from "react";
import { Icon } from "./icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "accent" | "danger";
type ButtonSize = "sm" | "md" | "lg";
type PressState = "hover" | "active" | null;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: string;
  iconRight?: string;
  fullWidth?: boolean;
}

const SIZES: Record<ButtonSize, { height: number; padding: string; font: string; gap: number; icon: number }> = {
  sm: { height: 30, padding: "0 12px", font: "var(--text-body-s)", gap: 6, icon: 15 },
  md: { height: 38, padding: "0 16px", font: "var(--text-body-m)", gap: 8, icon: 17 },
  lg: { height: 46, padding: "0 22px", font: "var(--text-body-l)", gap: 10, icon: 19 },
};

function palette(variant: ButtonVariant, state: PressState): CSSProperties {
  const p: Record<ButtonVariant, { base: CSSProperties; hover: CSSProperties; active: CSSProperties }> = {
    primary: {
      base: { background: "var(--action-primary-bg)", color: "var(--action-primary-fg)", border: "1px solid var(--action-primary-bg)" },
      hover: { background: "var(--action-primary-bg-hover)", borderColor: "var(--action-primary-bg-hover)" },
      active: { background: "var(--action-primary-bg-active)", borderColor: "var(--action-primary-bg-active)" },
    },
    secondary: {
      base: { background: "var(--action-secondary-bg)", color: "var(--action-secondary-fg)", border: "1px solid var(--border-subtle)" },
      hover: { background: "var(--paper-100)", borderColor: "var(--ink-300)" },
      active: { background: "var(--paper-200)", borderColor: "var(--ink-400)" },
    },
    ghost: {
      base: { background: "transparent", color: "var(--action-ghost-fg)", border: "1px solid transparent" },
      hover: { background: "var(--paper-100)" },
      active: { background: "var(--paper-200)" },
    },
    accent: {
      base: { background: "var(--surface-accent)", color: "var(--court-900)", border: "1px solid var(--optic-500)" },
      hover: { background: "var(--optic-500)", borderColor: "var(--optic-600)" },
      active: { background: "var(--optic-600)", borderColor: "var(--optic-600)" },
    },
    danger: {
      base: { background: "var(--signal-danger)", color: "var(--paper-000)", border: "1px solid var(--signal-danger)" },
      hover: { background: "#98291F", borderColor: "#98291F" },
      active: { background: "#7F2019", borderColor: "#7F2019" },
    },
  };
  const v = p[variant] || p.primary;
  return { ...v.base, ...(state === "hover" ? v.hover : null), ...(state === "active" ? v.active : null) };
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled = false,
  fullWidth = false,
  type = "button",
  style,
  ...rest
}: ButtonProps) {
  const [state, setState] = useState<PressState>(null);
  const s = SIZES[size] || SIZES.md;
  return (
    <button
      type={type}
      disabled={disabled}
      onMouseEnter={() => setState("hover")}
      onMouseLeave={() => setState(null)}
      onMouseDown={() => setState("active")}
      onMouseUp={() => setState("hover")}
      style={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : undefined,
        alignItems: "center",
        justifyContent: "center",
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontFamily: "var(--font-body)",
        fontSize: s.font,
        fontWeight: "var(--weight-medium)",
        letterSpacing: "-0.003em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "var(--transition-control)",
        ...palette(variant, disabled ? null : state),
        ...(disabled
          ? { background: "var(--action-disabled-bg)", color: "var(--action-disabled-fg)", border: "1px solid var(--ink-100)" }
          : null),
        ...style,
      }}
      {...rest}
    >
      {iconLeft ? <Icon name={iconLeft} size={s.icon} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={s.icon} /> : null}
    </button>
  );
}
