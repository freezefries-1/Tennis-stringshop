import { Fragment, type HTMLAttributes, type ReactNode } from "react";

export interface SpecListItem {
  label: string;
  value: ReactNode;
}

export interface SpecListProps extends HTMLAttributes<HTMLDListElement> {
  items?: SpecListItem[];
  dense?: boolean;
}

export function SpecList({ items = [], dense = false, style, ...rest }: SpecListProps) {
  return (
    <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "minmax(0,auto) minmax(0,1fr)", ...style }} {...rest}>
      {items.map((it, i) => (
        <Fragment key={it.label + i}>
          <dt
            style={{
              padding: dense ? "7px 20px 7px 0" : "11px 24px 11px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-label)",
              letterSpacing: "var(--ls-label)",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            {it.label}
          </dt>
          <dd
            style={{
              margin: 0,
              padding: dense ? "7px 0" : "11px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)",
              fontFamily: "var(--font-body)",
              fontSize: dense ? "var(--text-body-s)" : "var(--text-body-m)",
              color: "var(--text-primary)",
              textAlign: "right",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {it.value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
