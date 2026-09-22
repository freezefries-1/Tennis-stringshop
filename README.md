# SportCraft Workshop

A personal racket-stringing and racket-sports equipment management app: customers,
rackets, string jobs, sales, inventory, expenses and profit in one place, plus a
simple point-of-sale. Built for a single-person shop — no accounts, no payment
processing, SGD by default.

This is **Phase 1**: the app shell, navigation, global search and dashboard,
built against seed data. See `docs/architecture.html` for the full brief, the
database design, and the Phase 1–10 build plan, and `AGENTS.md` for where
things live in this repo.

## Stack

Next.js (App Router) · TypeScript · Tailwind · the SportCraft design system
(`_ds/`, ported to `src/components/ds/`) · Drizzle ORM schema, not yet
connected to a live database (`src/db/schema.ts`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to
`/dashboard`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` — ESLint
- `npm run db:generate` / `npm run db:push` — Drizzle migrations, once
  `DATABASE_URL` points at a real Postgres/Supabase instance

## History

This app was scaffolded from a Claude Design prototype. That handoff —
the original brief, the design assistant's chat transcript, and the HTML/JS
prototype it produced — is kept for reference under `docs/design-handoff/`.
