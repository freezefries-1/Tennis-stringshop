"use client";

import Link from "next/link";
import { IconButton } from "@/components/ds/icon-button";
import { Icon } from "@/components/ds/icon";
import { FOOTER_NAV, NAV } from "@/lib/nav";

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const items = [...NAV.filter((n) => n.value), ...FOOTER_NAV];
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-h">
          <div className="lab">Go to</div>
          <IconButton icon="x" label="Close" onClick={onClose} />
        </div>
        <div className="sheet-g">
          {items.map((n) => (
            <Link key={n.value} href={`/${n.value}`} className="sheet-i" onClick={onClose}>
              <Icon name={n.icon!} size={18} />
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
