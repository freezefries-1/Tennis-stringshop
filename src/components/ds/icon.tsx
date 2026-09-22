"use client";

import type { CSSProperties } from "react";
import {
  LayoutDashboard,
  Wrench,
  ScanLine,
  Users,
  CircleDot,
  Layers,
  Package,
  Library,
  Receipt,
  BarChart3,
  Settings,
  ClipboardCheck,
  Search,
  Plus,
  Menu,
  X,
  Check,
  Banknote,
  ArrowRight,
  Pencil,
  ChevronRight,
  Mail,
  Phone,
  Trash2,
  type LucideIcon,
} from "lucide-react";

// Every icon name this app uses, wired to lucide-react. Add to this map when a
// new screen needs a new glyph — see the design system readme for the stroke
// weight / size rules (`_ds/.../readme.md`, "Iconography").
const ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  wrench: Wrench,
  "scan-line": ScanLine,
  users: Users,
  "circle-dot": CircleDot,
  layers: Layers,
  package: Package,
  library: Library,
  receipt: Receipt,
  "bar-chart-3": BarChart3,
  settings: Settings,
  "clipboard-check": ClipboardCheck,
  search: Search,
  plus: Plus,
  menu: Menu,
  x: X,
  check: Check,
  banknote: Banknote,
  pencil: Pencil,
  "chevron-right": ChevronRight,
  mail: Mail,
  phone: Phone,
  "arrow-right": ArrowRight,
  trash: Trash2,
};

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  color = "currentColor",
  style,
  className,
}: IconProps) {
  const Glyph = ICONS[name];
  if (!Glyph) return null;
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "0 0 auto",
        color,
        ...style,
      }}
    >
      <Glyph size={size} strokeWidth={strokeWidth} color={color} />
    </span>
  );
}
