"use client";

import { Button } from "@/components/ds/button";
import { GlobalSearch } from "./global-search";
import { PAGES } from "@/lib/nav";

export function TopBar({ page }: { page: string }) {
  const p = PAGES[page] ?? PAGES.dashboard;
  return (
    <header className="top">
      <div className="top-t">
        <div className="lab">{p.label}</div>
        <h1>{p.title}</h1>
      </div>
      <GlobalSearch />
      <div className="top-a">
        {p.action ? (
          <Button size="sm" iconLeft="plus">
            {p.action}
          </Button>
        ) : null}
        {page === "dashboard" ? (
          <Button size="sm" iconLeft="plus">
            New string job
          </Button>
        ) : null}
      </div>
    </header>
  );
}
