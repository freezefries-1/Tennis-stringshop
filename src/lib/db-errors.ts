const FOREIGN_KEY_VIOLATION = "23503";

/** Postgres's FK-violation code, checked against both the thrown error and
 * its `.cause` — drizzle-orm wraps the driver's PostgresError (which
 * carries `.code`) inside a "Failed query: ..." Error whose own `.code` is
 * undefined, so checking only the outer error misses every violation and
 * lets the raw error crash the page instead of resolving to a friendly
 * "still in use" result. Shared by every deleteX() that guards against
 * deleting a row something else still references. */
export function isForeignKeyViolation(err: unknown): boolean {
  const codeOf = (e: unknown): unknown => (typeof e === "object" && e !== null && "code" in e ? (e as { code?: unknown }).code : undefined);
  if (codeOf(err) === FOREIGN_KEY_VIOLATION) return true;
  const cause = typeof err === "object" && err !== null && "cause" in err ? (err as { cause?: unknown }).cause : undefined;
  return codeOf(cause) === FOREIGN_KEY_VIOLATION;
}
