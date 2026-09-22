<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SportCraft Workshop

A personal racket-stringing and racket-sports equipment business management app
(customers → rackets → string jobs → sales → inventory → expenses → profit),
plus a simple POS. Single user, no auth beyond a deployment-level gate, SGD
currency. Full brief, phase plan and the reasoning behind the schema live in
`docs/architecture.html` — read it before building anything beyond Phase 1.

## Phase status

- **Phase 1** (shell, navigation, dashboard) — done, on seed data
  (`src/lib/data.ts`).
- **Phase 2** (customers + customer rackets) — done, on the real database.
  `/customers`, `/customers/new`, `/customers/[id]`, `/customers/[id]/edit`,
  and the nested `.../rackets/...` routes are real, not placeholders.
- Everything else (`jobs`, `pos`, `inventory`, `products`, `catalogue`,
  `expenses`, `reports`) is still `<Placeholder page="...">` — see
  `src/lib/nav.ts` for the phase each one is scheduled in. Don't build ahead
  of the current phase; build what a placeholder describes when its phase
  comes up, not before.

## Where things are

- `src/app/` — Next.js App Router routes.
- `src/app/customers/` — Phase 2 routes and server actions
  (`actions.ts` for customers, `racket-actions.ts` for rackets — a
  `"use server"` file may only export async functions, so their plain
  types/initial-state live in `src/lib/customer-form-types.ts` /
  `racket-form-types.ts` instead).
- `src/lib/customers.ts`, `src/lib/rackets.ts` — the data-access layer
  (Drizzle queries). `src/lib/racket-label.ts` is split out from
  `rackets.ts` specifically so Client Components can import the pure
  `racketLabel()` formatter without pulling the Postgres client into the
  browser bundle — don't merge it back in.
- `src/components/ds/` — the SportCraft design system's primitives (Button,
  Card, Badge, Icon, Field, Tabs, …), ported to TypeScript from the bundle at
  `_ds/sportcraft-design-system-.../_ds_bundle.js`. Compose UI from these
  rather than restyling raw HTML — see that folder's `readme.md` for the full
  visual language (colour, type, spacing, motion, voice). `Select`,
  `Checkbox`, `RadioGroup`, `Switch`, `Dialog`, `Toast`, `Tooltip`, `SideNav`,
  `Breadcrumbs` are still unported — the bundle has their source when a later
  phase needs one.
- `src/components/shell/` — the app chrome: sidebar, top bar, global search
  (⌘K — still seed-data only, doesn't search real customers), mobile bottom
  nav + "more" sheet.
- `src/components/dashboard/` — the Phase 1 dashboard (still seed data).
- `src/components/customers/` — Phase 2 UI: the customers list/search
  (table on desktop, cards on mobile — see `.dtable`/`.ccards` in
  `src/styles/app-shell.css`), the customer and racket forms, the profile
  tabs.
- `src/db/schema.ts` — the Drizzle schema matching `docs/architecture.html`
  §03–06 (snapshot columns, the `UNIQUE(string_job_id)` constraint that makes
  double-billing impossible, batch-level FIFO), extended for Phase 2:
  `customer_code_seq` / `racket_code_seq` generate the human-readable codes
  (`C0001`, `R0001`) as a column default, and `customer_rackets` carries
  manual-entry fields (brand/series/model/…) alongside a nullable
  `racket_model_id`, so Phase 3's catalogue can link existing rows via that
  column without discarding what was typed in by hand.
- `src/db/client.ts` — the live Drizzle/postgres.js connection, reading
  `DATABASE_URL`. Every server component/action that touches it needs
  `export const dynamic = "force-dynamic"` in its `page.tsx` so Next doesn't
  try to execute the query at build time.
- `drizzle/` — generated SQL migrations (`npm run db:generate`). Applied to
  the real database by hand via the Supabase SQL editor the first time (this
  sandbox's network policy blocks outbound Postgres ports, 5432/6543, so
  `npm run db:push` can't reach Supabase from here — only 80/443 are open).
  If a future session *can* reach the database directly, `db:push` works
  the normal way. `0001_enable_rls.sql` is a custom migration (`drizzle-kit
  generate --custom`), not schema-derived — it `ALTER TABLE ... ENABLE ROW
  LEVEL SECURITY` on every table, no policies. This app always connects as
  the Postgres superuser (`src/db/client.ts`), which bypasses RLS
  unconditionally, so this has zero effect on any query the app makes — its
  only purpose is closing Supabase's public PostgREST API (exposed by
  default for every table to anyone with the project's `anon` key, which
  this app never uses but which still exists). **New tables need the same
  treatment** — add an `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` line to
  whatever migration creates them.
- `_ds/` — the full design-system bundle as exported (guidelines, unported
  components, the two reference UI kits). Consult it before inventing a new
  component.
- `docs/design-handoff/` — the original Claude Design handoff (README, chat
  transcript, the HTML/JS prototype this app was built from). Historical
  reference only; don't build against it directly, build against this app.

## Working here

- Follow the design system's rules (see its `readme.md`): court green is
  structural, optic yellow-green at most once per view, max two background
  colours per screen, flat backgrounds, sentence case, no emoji, verb + object
  buttons.
- Money is integer cents in the schema; the UI formats via
  `src/lib/format.ts`. Never recompute a snapshotted value (see the schema's
  header comment and `docs/architecture.html` §03).
- If you can reach a real Postgres from your environment (this sandbox
  can't past ports 80/443), install it locally rather than trusting
  DB-backed code untested — `service postgresql start`, create a scratch
  database, point `DATABASE_URL` at it, `npm run db:push`, and exercise the
  actual flows before calling anything done. That's how a real bug in the
  Phase 2 duplicate-phone check got caught: `'\D'` in a plain JS template
  literal silently drops the backslash and becomes just `'D'` — the fix is
  `'\\D'` (see the comment in `src/lib/customers.ts`). The query looked
  correct on inspection and only failed against live data.
