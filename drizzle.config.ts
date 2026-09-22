import type { Config } from "drizzle-kit";

// Not wired to a live database yet (see src/db/schema.ts). Once a Supabase
// Postgres connection string exists, set DATABASE_URL and `npm run db:push`
// (or `db:generate` + a migration run) creates the schema for real.
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
