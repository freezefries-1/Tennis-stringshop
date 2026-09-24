// Deployment-level PIN gate (see src/lib/auth-pin.ts). Named `proxy.ts`,
// not `middleware.ts` — Next.js 16 deprecated and renamed the file
// convention (function export name changed too); see
// node_modules/next/dist/docs/.../file-conventions/proxy.md.

import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, configuredPin, hashPin } from "@/lib/auth-pin";

export function proxy(request: NextRequest) {
  const pin = configuredPin();
  // No PIN configured (APP_PIN env var unset) — the gate is a no-op rather
  // than locking everyone out of a deployment that hasn't set it up yet.
  if (!pin) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token === hashPin(pin)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/unlock";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except the unlock page itself, its own form submission, and
  // static/build assets — those must stay reachable or the redirect loop
  // never resolves and the app shell (icons, JS bundles) never loads.
  matcher: ["/((?!unlock|_next/static|_next/image|favicon.ico|icon).*)"],
};
