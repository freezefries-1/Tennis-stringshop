"use client";

import Link from "next/link";
import { Button } from "@/components/ds/button";
import { GlobalSearch } from "./global-search";
import { BackButton } from "./back-button";
import { HomeButton } from "./home-button";
import { PAGES } from "@/lib/nav";

export function TopBar({ page }: { page: string }) {
  const p = PAGES[page] ?? PAGES.dashboard;
  return (
    <header className="top">
      <BackButton />
      {page !== "dashboard" ? <HomeButton /> : null}
      <div className="top-t">
        <div className="lab">{p.label}</div>
        <h1>{p.title}</h1>
      </div>
      <GlobalSearch />
      <div className="top-a">
        {p.action ? (
          p.actionHref ? (
            <Link href={p.actionHref}>
              <Button size="sm" iconLeft="plus">
                {p.action}
              </Button>
            </Link>
          ) : (
            <Button size="sm" iconLeft="plus">
              {p.action}
            </Button>
          )
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
