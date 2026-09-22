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
- **Phase 3** (master racket database) — done. `/catalogue` and
  `/catalogue/brands` are real; the Add/Edit Racket form (Phase 2) now
  offers a "From racket database" mode (cascading Brand → Series → Model
  picker, with inline quick-create at every level) alongside "Manual entry"
  (the original Phase 2 free-text fields, kept as the fallback/unknown-racket
  path). A racket linked to a model shows "Model specifications" (from the
  catalogue, read-only) separately from "Actual racket" (this physical
  frame's own measured data) — see `RacketWithSpecs` in `src/lib/rackets.ts`.
- Everything else (`jobs`, `pos`, `inventory`, `products`, `expenses`,
  `reports`) is still `<Placeholder page="...">` — see `src/lib/nav.ts` for
  the phase each one is scheduled in. Don't build ahead of the current
  phase; build what a placeholder describes when its phase comes up, not
  before. The top-level "Rackets" nav item is *also* still a placeholder —
  it was meant for a future global cross-customer racket index/search, which
  is a different thing from `/catalogue` (the master model database) and
  from the per-customer racket lists Phase 2 already built; nothing built it
  yet, in any phase.

## Where things are

- `src/app/` — Next.js App Router routes.
- `src/app/customers/` — Phase 2 routes and server actions
  (`actions.ts` for customers, `racket-actions.ts` for rackets — a
  `"use server"` file may only export async functions, so their plain
  types/initial-state live in `src/lib/customer-form-types.ts` /
  `racket-form-types.ts` instead).
- `src/lib/customers.ts`, `src/lib/rackets.ts`, `src/lib/racket-catalogue.ts`
  — the data-access layer (Drizzle queries). `src/lib/racket-label.ts` is
  split out from `rackets.ts`/`racket-catalogue.ts` specifically so Client
  Components can import the pure `racketLabel()`/`formatStringPattern()`
  formatters without pulling the Postgres client into the browser bundle —
  don't merge it back in. Same reasoning behind
  `src/components/customers/racket-picker-actions.ts` (a `"use server"` RPC
  file the Brand/Series/Model picker calls directly from client code — not
  a `<form action>`, just plain async function calls) and
  `src/lib/model-form-types.ts` / `racket-form-types.ts` /
  `customer-form-types.ts` (plain types + initial state kept out of the
  `"use server"` action files, which may only export async functions).
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
- `src/components/customers/` — the customers list/search (table on
  desktop, cards on mobile — see `.dtable`/`.ccards` in
  `src/styles/app-shell.css`), the customer and racket forms (Phase 2),
  the profile tabs, and Phase 3's `RacketModelPicker` (the cascading
  Brand/Series/Model selector embedded in the racket form).
- `src/components/catalogue/` — Phase 3 UI: the model browse/search/filter
  view, the brand/series manager (accordion, inline add/edit/archive), the
  model create/edit form. `src/components/ds/combobox.tsx` is the shared
  search-to-filter dropdown both this and `RacketModelPicker` build on.
- `src/db/schema.ts` — the Drizzle schema matching `docs/architecture.html`
  §03–06 (snapshot columns, the `UNIQUE(string_job_id)` constraint that makes
  double-billing impossible, batch-level FIFO), extended for Phase 2:
  `customer_code_seq` / `racket_code_seq` generate the human-readable codes
  (`C0001`, `R0001`) as a column default. Extended again for Phase 3:
  `racket_models` gained `generation_name`, structured
  `string_pattern_mains`/`crosses` (replacing a free-text column), and
  standard balance/length/tension fields; `customer_rackets` gained
  `nickname`. A customer racket's `racket_model_id` (nullable) links it to
  a catalogue model — when set, brand/series/model/specs resolve from the
  join (`RacketWithSpecs` in `rackets.ts`) instead of the racket's own
  free-text columns, which stay in place either way as the
  manual/unknown-racket fallback.
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
  whatever migration creates them. `0002`/`0003` (Phase 3) are split into
  an additive migration and a drop, in that order, specifically to dodge
  `drizzle-kit generate`'s interactive rename-vs-drop+add prompt — that
  prompt needs a real TTY and hangs forever in this sandbox; two
  unambiguous diffs (nothing removed in the same table a column is added
  to) never trigger it. Reach for the same split if a future schema change
  both drops and adds columns on one table.
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
