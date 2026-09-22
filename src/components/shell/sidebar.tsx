"use client";

import Link from "next/link";
import { Icon } from "@/components/ds/icon";
import { FOOTER_NAV, NAV } from "@/lib/nav";

export function Sidebar({ page }: { page: string }) {
  return (
    <aside className="side">
      <div className="brand">
        <span className="brand-n">SportCraft</span>
        <span className="brand-t num">Workshop</span>
      </div>
      <nav className="nav">
        {NAV.map((n, i) =>
          n.section ? (
            <div className="nav-s lab" key={"s" + i}>
              {n.section}
            </div>
          ) : (
            <Link key={n.value} href={`/${n.value}`} className={"nav-i" + (page === n.value ? " on" : "")}>
              <Icon name={n.icon!} size={17} />
              <span>{n.label}</span>
              {n.count ? <span className="nav-c num">{n.count}</span> : null}
            </Link>
          ),
        )}
      </nav>
      <div className="side-f">
        {FOOTER_NAV.map((n) => (
          <Link key={n.value} href={`/${n.value}`} className={"nav-i" + (page === n.value ? " on" : "")}>
            <Icon name={n.icon!} size={17} />
            <span>{n.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
