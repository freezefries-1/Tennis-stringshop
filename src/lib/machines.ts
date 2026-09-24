// Stringing machines — Phase 4.5-ish add-on, no phase of its own. Lets a
// string job record which physical machine strung it (useful once there's
// more than one, or the current one is retired/replaced) and drives a
// simple usage-based "needs cleaning" reminder, since string tension load
// (not elapsed time) is what actually dirties/wears a machine.

import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { stringingMachines, stringJobs } from "@/db/schema";

export type Machine = typeof stringingMachines.$inferSelect;

export interface MachineOption {
  id: string;
  name: string;
}

export interface MachineWithStats extends Machine {
  /** All-time completed/collected jobs strung on this machine. */
  totalJobs: number;
  /** Completed/collected jobs strung since lastCleanedAt (or all-time, if
   * never cleaned) — the number the "needs cleaning" reminder is based on. */
  jobsSinceClean: number;
  needsCleaning: boolean;
}

const STRUNG_STATUSES = sql`(${stringJobs.status} in ('completed','collected'))`;

/** Fetched in full (a shop has a handful of machines, not hundreds) with
 * job counts attached via two grouped queries — never one query per
 * machine — so this stays 3 queries total regardless of machine count. */
export async function listMachines(includeArchived = false): Promise<MachineWithStats[]> {
  const machines = await db
    .select()
    .from(stringingMachines)
    .where(includeArchived ? undefined : isNull(stringingMachines.archivedAt))
    .orderBy(asc(stringingMachines.name));
  if (machines.length === 0) return [];

  const machineIds = machines.map((m) => m.id);

  const totals = await db
    .select({ machineId: stringJobs.machineId, count: sql<number>`count(*)::int` })
    .from(stringJobs)
    .where(and(inArray(stringJobs.machineId, machineIds), STRUNG_STATUSES))
    .groupBy(stringJobs.machineId);

  // jobsSinceClean compares each job against ITS OWN machine's
  // lastCleanedAt, which a single WHERE clause can't express without
  // joining back to the machines table — a plain global "since date"
  // wouldn't work since machines can be cleaned on different schedules.
  const sinceClean = await db
    .select({ machineId: stringJobs.machineId, count: sql<number>`count(*)::int` })
    .from(stringJobs)
    .innerJoin(stringingMachines, eq(stringingMachines.id, stringJobs.machineId))
    .where(
      and(
        inArray(stringJobs.machineId, machineIds),
        STRUNG_STATUSES,
        sql`(${stringingMachines.lastCleanedAt} is null or ${stringJobs.completedAt} > ${stringingMachines.lastCleanedAt})`,
      ),
    )
    .groupBy(stringJobs.machineId);

  const totalMap = new Map(totals.map((r) => [r.machineId, r.count]));
  const sinceMap = new Map(sinceClean.map((r) => [r.machineId, r.count]));

  return machines.map((m) => {
    const totalJobs = totalMap.get(m.id) ?? 0;
    const jobsSinceClean = sinceMap.get(m.id) ?? 0;
    return { ...m, totalJobs, jobsSinceClean, needsCleaning: jobsSinceClean >= m.cleanIntervalJobs };
  });
}

/** Active machines only, id/name — the job detail page's picker.
 * `alwaysIncludeId` force-includes one archived machine (the job's current
 * selection, if it was archived after being assigned) so the picker never
 * silently drops what a job is already set to, same "archiving keeps it
 * visible on existing records" reasoning as racket brands/series. */
export async function listMachineOptions(alwaysIncludeId?: string | null): Promise<MachineOption[]> {
  const rows = await db
    .select({ id: stringingMachines.id, name: stringingMachines.name, archivedAt: stringingMachines.archivedAt })
    .from(stringingMachines)
    .orderBy(asc(stringingMachines.name));
  return rows.filter((m) => !m.archivedAt || m.id === alwaysIncludeId).map((m) => ({ id: m.id, name: m.name }));
}

export async function createMachine(name: string): Promise<Machine> {
  const [row] = await db.insert(stringingMachines).values({ name: name.trim() }).returning();
  return row;
}

export interface MachineUpdateInput {
  name: string;
  cleanIntervalJobs: number;
  notes: string | null;
}

export async function updateMachine(id: string, input: MachineUpdateInput): Promise<Machine | null> {
  const [row] = await db
    .update(stringingMachines)
    .set({ name: input.name.trim(), cleanIntervalJobs: input.cleanIntervalJobs, notes: input.notes?.trim() || null })
    .where(eq(stringingMachines.id, id))
    .returning();
  return row ?? null;
}

export async function setMachineArchived(id: string, archived: boolean): Promise<void> {
  await db
    .update(stringingMachines)
    .set({ archivedAt: archived ? new Date() : null })
    .where(eq(stringingMachines.id, id));
}

/** Resets the "needs cleaning" count to zero from now — jobs strung before
 * this moment no longer count toward the next reminder. */
export async function markMachineCleaned(id: string): Promise<void> {
  await db.update(stringingMachines).set({ lastCleanedAt: new Date() }).where(eq(stringingMachines.id, id));
}
