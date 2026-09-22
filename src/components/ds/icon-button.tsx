"use client";

import { useState, type ButtonHTMLAttributes } from "react";
import { Icon } from "./icon";

type IconButtonVariant = "ghost" | "outline" | "solid";
type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

const SIZES: Record<IconButtonSize, { box: number; icon: number }> = {
  sm: { box: 30, icon: 16 },
  md: { box: 38, icon: 18 },
  lg: { box: 46, icon: 20 },
};

export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  style,
  ...rest
}: IconButtonProps) {
  const [hover, setHover] = useState(false);
  const s = SIZES[size] || SIZES.md;
  const skin = {
    ghost: { background: hover ? "var(--paper-100)" : "transparent", color: "var(--ink-700)", border: "1px solid transparent" },
    outline: { background: hover ? "var(--paper-100)" : "var(--paper-000)", color: "var(--ink-800)", border: "1px solid var(--border-subtle)" },
    solid: { background: hover ? "var(--action-primary-bg-hover)" : "var(--action-primary-bg)", color: "var(--paper-000)", border: "1px solid transparent" },
  }[variant];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: s.box,
        height: s.box,
        borderRadius: "var(--radius-sm)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "var(--transition-control)",
        ...skin,
        ...(disabled
          ? { background: "var(--action-disabled-bg)", color: "var(--action-disabled-fg)", border: "1px solid var(--ink-100)" }
          : null),
        ...style,
      }}
      {...rest}
    >
      <Icon name={icon} size={s.icon} />
    </button>
  );
}
