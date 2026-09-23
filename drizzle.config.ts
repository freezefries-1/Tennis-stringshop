import type { Config } from "drizzle-kit";

// Live against Supabase Postgres via DATABASE_URL. `npm run db:generate`
// produces a migration file (applied by hand via the Supabase SQL editor —
// see AGENTS.md); `npm run db:push` diffs and applies directly, but only
// works from an environment that can actually reach Supabase's Postgres
// port.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
