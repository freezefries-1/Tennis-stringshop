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
// `max: 1` — Supabase's own recommendation for serverless (Vercel) on the
// transaction pooler: postgres.js defaults to holding up to 10 connections
// per client instance, and Vercel spins up many separate function
// instances, each with its own client. Without this cap, concurrent
// traffic (or even one request with a lot of parallel queries, like the
// dashboard's Promise.all of several financial summaries) can open enough
// connections across instances to exhaust the pooler's capacity — new
// connection attempts then queue/hang rather than fail cleanly, which is
// exactly what an indefinitely-loading page looks like. The transaction
// pooler is what does the real multiplexing; each function instance only
// needs to hold one connection at a time.
const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });
