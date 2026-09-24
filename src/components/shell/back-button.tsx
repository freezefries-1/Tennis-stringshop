"use client";

import { useRouter, usePathname } from "next/navigation";
import { IconButton } from "@/components/ds/icon-button";
import { getBackHref } from "@/lib/back-nav";

/** A deterministic parent for detail/edit/nested routes (e.g. a job's edit
 * page always goes back to that same job, never wherever browser history
 * happens to say) — see back-nav.ts's route table. Falls back to ordinary
 * browser-history back for top-level list pages, which have no single
 * obvious parent. */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const href = getBackHref(pathname);
  return (
    <IconButton
      icon="chevron-right"
      label="Go back"
      variant="ghost"
      size="sm"
      onClick={() => (href ? router.push(href) : router.back())}
      style={{ transform: "rotate(180deg)", flexShrink: 0 }}
    />
  );
}
