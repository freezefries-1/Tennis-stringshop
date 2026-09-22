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

## Where things are

- `src/app/` — Next.js App Router routes. Each nav section is its own route
  (`/dashboard`, `/jobs`, `/pos`, …); everything except `/dashboard` currently
  renders `<Placeholder page="...">` (see `src/lib/nav.ts` for the phase each
  one is scheduled in).
- `src/components/ds/` — the SportCraft design system's primitives (Button,
  Card, Badge, Icon, …), ported to TypeScript from the bundle at
  `_ds/sportcraft-design-system-.../_ds_bundle.js`. Compose UI from these
  rather than restyling raw HTML — see that folder's `readme.md` for the full
  visual language (colour, type, spacing, motion, voice).
- `src/components/shell/` — the app chrome: sidebar, top bar, global search
  (⌘K), mobile bottom nav + "more" sheet.
- `src/components/dashboard/` — the Phase 1 dashboard.
- `src/lib/data.ts` — in-memory seed data the dashboard reads today.
- `src/db/schema.ts` — the Drizzle schema matching `docs/architecture.html`
  §03–06 (snapshot columns, the `UNIQUE(string_job_id)` constraint that makes
  double-billing impossible, batch-level FIFO). **Not connected to a live
  database yet** — no `src/db/client.ts` exists. When Supabase credentials are
  available, add one, set `DATABASE_URL`, and `npm run db:push`.
- `_ds/` — the full design-system bundle as exported (guidelines, unported
  components like Select/Dialog/Tooltip/SideNav, the two reference UI kits).
  Consult it before inventing a new component.
- `docs/design-handoff/` — the original Claude Design handoff (README, chat
  transcript, the HTML/JS prototype this app was built from). Historical
  reference only; don't build against it directly, build against this app.

## Working here

- Follow the design system's rules (see its `readme.md`): court green is
  structural, optic yellow-green at most once per view, max two background
  colours per screen, flat backgrounds, sentence case, no emoji, verb + object
  buttons.
- Don't build ahead of the current phase. Each `Placeholder` page already
  states what it needs — build that when its phase comes up, not before.
- Money is integer cents in the schema; the UI formats via
  `src/lib/format.ts`. Never recompute a snapshotted value (see the schema's
  header comment and `docs/architecture.html` §03).
