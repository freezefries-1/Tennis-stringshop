"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileNav } from "./mobile-nav";
import { MoreSheet } from "./more-sheet";
import { DEFAULT_PAGE } from "@/lib/nav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  const page = pathname === "/" ? DEFAULT_PAGE : pathname.slice(1).split("/")[0];

  // The PIN lock screen isn't part of the app proper — no sidebar/top bar
  // to click through to pages the proxy (src/proxy.ts) will just bounce
  // straight back here anyway.
  if (page === "unlock") return <>{children}</>;

  // Printable pages (Sale receipt, String Job label) render their own
  // minimal layout at an exact physical size — the sidebar/top bar/mobile
  // nav were never meant to be part of what comes out of the printer, and
  // with no @media print rule anywhere to hide them, they'd otherwise
  // print right along with the receipt/label content.
  if (pathname.endsWith("/receipt") || pathname.endsWith("/label")) return <>{children}</>;

  return (
    <div className="app">
      <Sidebar page={page} />
      <main className="main">
        <TopBar page={page} />
        <div className="body">{children}</div>
      </main>
      <MobileNav page={page} onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} />
    </div>
  );
}
