// Where the top bar's back button should go for each route — an explicit
// table, not "strip the last URL segment", because that breaks for routes
// where an intermediate segment isn't a real page (customer_rackets has no
// standalone list route; "rackets" is just a URL namespace under a
// customer's own profile, not something users could ever be sent to).
//
// Each entry is [pattern, parent], where :name matches one path segment.
// Patterns are checked most-specific first (longest first) so e.g. a
// customer racket edit page matches its own rule before the shorter
// customer-edit rule could accidentally match a suffix of it.

const ROUTES: [string, string][] = [
  ["/customers/:id/rackets/:racketId/edit", "/customers/:id/rackets/:racketId"],
  ["/customers/:id/rackets/:racketId", "/customers/:id"],
  ["/customers/:id/rackets/new", "/customers/:id"],
  ["/customers/:id/edit", "/customers/:id"],
  ["/customers/:id", "/customers"],
  ["/customers/new", "/customers"],

  ["/jobs/:id/edit", "/jobs/:id"],
  ["/jobs/:id", "/jobs"],
  ["/jobs/new", "/jobs"],

  ["/sales/:id/receipt", "/sales/:id"],
  ["/sales/:id", "/sales"],

  ["/products/:id/edit", "/products/:id"],
  ["/products/:id", "/products"],
  ["/products/new", "/products"],
  ["/products/categories", "/products"],
  ["/products/receive", "/products"],

  ["/inventory/products/:id/edit", "/inventory/products/:id"],
  ["/inventory/products/:id", "/inventory"],
  ["/inventory/receive", "/inventory"],

  ["/catalogue/models/:id/edit", "/catalogue/models/:id"],
  ["/catalogue/models/:id", "/catalogue"],
  ["/catalogue/models/new", "/catalogue"],
  ["/catalogue/brands", "/catalogue"],

  ["/expenses/recurring/:id/edit", "/expenses/recurring"],
  ["/expenses/recurring/new", "/expenses/recurring"],
  ["/expenses/recurring", "/expenses"],
  ["/expenses/:id/edit", "/expenses/:id"],
  ["/expenses/:id", "/expenses"],
  ["/expenses/new", "/expenses"],
  ["/expenses/categories", "/expenses"],
  ["/expenses/import", "/expenses"],

  ["/other-income/:id/edit", "/other-income/:id"],
  ["/other-income/:id", "/other-income"],
  ["/other-income/new", "/other-income"],
  ["/other-income/categories", "/other-income"],

  ["/reports/:section", "/reports"],
];

function matchPattern(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const pp = patternParts[i];
    if (pp.startsWith(":")) params[pp.slice(1)] = pathParts[i];
    else if (pp !== pathParts[i]) return null;
  }
  return params;
}

function fillPattern(pattern: string, params: Record<string, string>): string {
  return "/" + pattern
    .split("/")
    .filter(Boolean)
    .map((part) => (part.startsWith(":") ? params[part.slice(1)] : part))
    .join("/");
}

/** The explicit parent for a detail/edit/nested route — deterministic,
 * never raw browser history (which can land somewhere unrelated depending
 * on how the user actually got there: a bookmark, a search result, a link
 * from an unrelated page). Returns null for anything not listed above —
 * notably every top-level list page itself (/customers, /jobs, /reports,
 * ...), which has no single obvious parent and is left on ordinary
 * browser-history back, same as before this table existed. */
export function getBackHref(pathname: string): string | null {
  for (const [pattern, parent] of ROUTES) {
    const params = matchPattern(pattern, pathname);
    if (params) return fillPattern(parent, params);
  }
  return null;
}
