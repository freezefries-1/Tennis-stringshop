"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ds/icon";
import { FOOTER_NAV, NAV } from "@/lib/nav";
import { fetchActiveJobsCount } from "./nav-actions";

export function Sidebar({ page }: { page: string }) {
  // Real active-job count for "String jobs" (received/waiting/in_progress —
  // same definition as the Jobs page's own stat card), replacing the old
  // static seed-data count. Re-fetched whenever the top-level route
  // changes, since the sidebar itself stays mounted across navigations and
  // wouldn't otherwise notice a job completed/created/cancelled elsewhere.
  const [activeJobs, setActiveJobs] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetchActiveJobsCount().then((n) => {
      if (!cancelled) setActiveJobs(n);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

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
              {(() => {
                const count = n.value === "jobs" ? activeJobs : n.count;
                return count ? <span className="nav-c num">{count}</span> : null;
              })()}
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
