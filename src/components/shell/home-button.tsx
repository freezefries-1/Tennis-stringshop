"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ds/icon-button";

/** Jumps straight to the dashboard, regardless of browser history — the
 * fixed counterpart to BackButton's "wherever I came from". */
export function HomeButton() {
  const router = useRouter();
  return (
    <IconButton
      icon="home"
      label="Go to dashboard"
      variant="ghost"
      size="sm"
      onClick={() => router.push("/dashboard")}
      style={{ flexShrink: 0 }}
    />
  );
}
