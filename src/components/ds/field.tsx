import type { HTMLAttributes, ReactNode } from "react";

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children?: ReactNode;
}

export function Field({ label, hint, error, required = false, htmlFor, children, style, ...rest }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }} {...rest}>
      {label ? (
        <label
          htmlFor={htmlFor}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-label)",
            letterSpacing: "var(--ls-label)",
            textTransform: "uppercase",
            color: "var(--ink-600)",
            display: "inline-flex",
            gap: 5,
          }}
        >
          {label}
          {required ? <span style={{ color: "var(--clay-600)" }}>*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-s)", color: "var(--signal-danger)" }}>{error}</span>
      ) : hint ? (
        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-body-s)", color: "var(--text-muted)" }}>{hint}</span>
      ) : null}
    </div>
  );
}
