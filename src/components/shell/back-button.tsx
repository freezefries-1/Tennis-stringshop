"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ds/icon-button";

/** Browser-history back (not a fixed "up one level" link) — takes the user
 * to wherever they actually came from, matching how they navigated in. */
export function BackButton() {
  const router = useRouter();
  return (
    <IconButton
      icon="chevron-right"
      label="Go back"
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      style={{ transform: "rotate(180deg)", flexShrink: 0 }}
    />
  );
}
