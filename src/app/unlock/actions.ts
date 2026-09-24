"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, configuredPin, hashPin } from "@/lib/auth-pin";
import type { UnlockState } from "./unlock-form-types";

export async function unlockAction(prevState: UnlockState, formData: FormData): Promise<UnlockState> {
  const pin = configuredPin();
  const entered = String(formData.get("pin") ?? "").trim();
  const next = String(formData.get("next") ?? "").trim();

  // Same message either way (misconfigured vs. wrong PIN) — no reason to
  // tell an unauthenticated visitor which one it is.
  if (!pin || entered !== pin) {
    return { status: "error", message: "Incorrect PIN." };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, hashPin(pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days — a personal device shouldn't have to re-enter this constantly
  });

  redirect(next && next.startsWith("/") ? next : "/dashboard");
}
