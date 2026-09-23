const FOREIGN_KEY_VIOLATION = "23503";
const UNIQUE_VIOLATION = "23505";

function codeOf(e: unknown): unknown {
  return typeof e === "object" && e !== null && "code" in e ? (e as { code?: unknown }).code : undefined;
}

function causeOf(err: unknown): unknown {
  return typeof err === "object" && err !== null && "cause" in err ? (err as { cause?: unknown }).cause : undefined;
}

/** Postgres's FK-violation code, checked against both the thrown error and
 * its `.cause` — drizzle-orm wraps the driver's PostgresError (which
 * carries `.code`) inside a "Failed query: ..." Error whose own `.code` is
 * undefined, so checking only the outer error misses every violation and
 * lets the raw error crash the page instead of resolving to a friendly
 * "still in use" result. Shared by every deleteX() that guards against
 * deleting a row something else still references. */
export function isForeignKeyViolation(err: unknown): boolean {
  if (codeOf(err) === FOREIGN_KEY_VIOLATION) return true;
  return codeOf(causeOf(err)) === FOREIGN_KEY_VIOLATION;
}

/** Same cause-unwrapping as isForeignKeyViolation, for Postgres's
 * unique-violation code — used by createSale's idempotency guard (brief
 * §51): a concurrent duplicate checkout with the same clientRequestId hits
 * sales.client_request_id's unique constraint instead of creating a second
 * Sale, and this is how that race is told apart from a genuine error. */
export function isUniqueViolation(err: unknown): boolean {
  if (codeOf(err) === UNIQUE_VIOLATION) return true;
  return codeOf(causeOf(err)) === UNIQUE_VIOLATION;
}
