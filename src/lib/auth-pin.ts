// The deployment-level PIN gate (docs/architecture.html's "single user, no
// auth beyond a deployment-level gate"). Deliberately simple — one shared
// PIN in an env var, not a user/password system — since this is a single-
// person tool, not a multi-tenant app.
//
// The cookie never stores the PIN itself, only a SHA-256 hash of it, so
// reading the cookie doesn't hand over the PIN even though the check itself
// isn't cryptographically strong (a short PIN is still brute-forceable if
// someone gets the hash) — proportionate for "keep casual visitors out",
// not bank-grade security.

import { createHash } from "crypto";

export const AUTH_COOKIE = "sc_auth";

export function configuredPin(): string | null {
  const pin = process.env.APP_PIN;
  return pin && pin.trim() ? pin.trim() : null;
}

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}
