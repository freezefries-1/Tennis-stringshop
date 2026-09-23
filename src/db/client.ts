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
// NOT capping `max` here: this is a single-user app (brief: "no auth beyond
// a deployment-level gate"), so cross-request connection-pool exhaustion
// across many concurrent users was never the realistic risk. An earlier
// attempt at `max: 1` was reverted — it forced every query within a single
// request onto one connection, serializing what used to run in parallel,
// which made pages that fire off many queries at once (the dashboard) slower
// and pushed them into Vercel's function timeout instead of fixing anything.
// The actual fix for that is doing less DB work per request (see
// src/app/dashboard/page.tsx), not starving a single request of parallelism.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
