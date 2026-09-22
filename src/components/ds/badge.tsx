import type { CSSProperties, HTMLAttributes } from "react";

type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}

const TONES: Record<BadgeTone, { background: string; color: string; border: string }> = {
  neutral: { background: "var(--ink-050)", color: "var(--ink-700)", border: "var(--ink-100)" },
  brand: { background: "var(--court-050)", color: "var(--court-700)", border: "var(--court-100)" },
  success: { background: "var(--signal-success-bg)", color: "var(--signal-success)", border: "#C4E3D3" },
  warning: { background: "var(--signal-warning-bg)", color: "var(--signal-warning)", border: "#EEDCAE" },
  danger: { background: "var(--signal-danger-bg)", color: "var(--signal-danger)", border: "#EFCBC6" },
  info: { background: "var(--signal-info-bg)", color: "var(--signal-info)", border: "#CBD8EE" },
  accent: { background: "var(--optic-100)", color: "#5C6B12", border: "var(--optic-200)" },
};

export function Badge({ children, tone = "neutral", dot = false, style, ...rest }: BadgeProps) {
  const t = TONES[tone] || TONES.neutral;
  const dotStyle: CSSProperties = { width: 5, height: 5, borderRadius: "50%", background: t.color };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 22,
        padding: "0 8px",
        borderRadius: "var(--radius-xs)",
        background: t.background,
        color: t.color,
        border: "1px solid " + t.border,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-s)",
        letterSpacing: "var(--ls-mono-s)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {dot ? <span style={dotStyle} /> : null}
      {children}
    </span>
  );
}
