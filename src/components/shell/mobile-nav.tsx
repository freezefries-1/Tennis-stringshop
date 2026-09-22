"use client";

import Link from "next/link";
import { Icon } from "@/components/ds/icon";

const TABS = [
  { v: "jobs", l: "Jobs", i: "wrench" },
  { v: "customers", l: "Customers", i: "users" },
  { v: "__new", l: "New", i: "plus" },
  { v: "pos", l: "POS", i: "scan-line" },
  { v: "__more", l: "More", i: "menu" },
] as const;

export function MobileNav({ page, onMore }: { page: string; onMore: () => void }) {
  return (
    <nav className="mnav">
      {TABS.map((t) =>
        t.v === "__new" ? (
          <button key={t.v} className="mnav-new" onClick={onMore} aria-label="New">
            <Icon name="plus" size={22} />
          </button>
        ) : t.v === "__more" ? (
          <button key={t.v} className={"mnav-i" + (page === t.v ? " on" : "")} onClick={onMore}>
            <Icon name={t.i} size={20} />
            <span>{t.l}</span>
          </button>
        ) : (
          <Link key={t.v} href={`/${t.v}`} className={"mnav-i" + (page === t.v ? " on" : "")}>
            <Icon name={t.i} size={20} />
            <span>{t.l}</span>
          </Link>
        ),
      )}
    </nav>
  );
}
