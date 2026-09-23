import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — see .env.local (copy it if missing) or Vercel's project environment variables.");
}

// `prepare: false` — Supabase's connection pooler runs in transaction mode
// (port 6543), which doesn't support prepared statements.
//
// `max: 30` — raised from postgres.js's default of 10. Production timing
// logs on the dashboard route (the heaviest page — see its file comment)
// showed individual queries taking ~1-1.5s each, dominated by connection
// setup rather than query execution (indexes fixed the latter already; see
// migration 0015). A single dashboard load fans out to roughly 25-30
// DB round trips across its 7 top-level calls once you count each one's own
// internal Promise.all (getFinancialSummary alone needs ~10). Against a
// pool capped at 10, most of those round trips queue for a free connection
// instead of running concurrently, and the request never fully resolves
// before Vercel's function timeout.
//
// An earlier attempt at `max: 1` was reverted — capping DOWN made this
// exact problem worse (serialized 25-30 round trips onto one connection).
// That guidance is meant for SESSION-mode/direct connections, where each
// one ties up a real Postgres backend for its whole lifetime; this app
// connects through the TRANSACTION-mode pooler (port 6543), which is
// specifically built to multiplex many concurrent client connections
// cheaply against a small number of real backend connections — the
// opposite lever applies here. This is a single-user app, so raising this
// has no realistic risk of exhausting Supabase's pooler capacity from
// concurrent users; it only affects how many of this ONE request's own
// round trips can proceed at once instead of queueing behind each other.
const client = postgres(connectionString, { prepare: false, max: 30 });

export const db = drizzle(client, { schema });
