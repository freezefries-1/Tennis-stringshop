"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ds/card";
import { Button } from "@/components/ds/button";
import { Input } from "@/components/ds/input";
import { Field } from "@/components/ds/field";
import { Icon } from "@/components/ds/icon";
import { Badge } from "@/components/ds/badge";
import { formatDate } from "@/lib/format";
import type { MachineWithStats } from "@/lib/machines";
import { archiveMachineAction, createMachineAction, markMachineCleanedAction, updateMachineAction } from "@/app/machines/actions";

/** No local copy of the server-computed fields (totalJobs, jobsSinceClean,
 * archivedAt, ...) — every mutating action calls router.refresh() so this
 * always renders whatever the server just recomputed, the same reasoning
 * ChangePaymentStatusControl documents for jobs. Only the in-progress edit
 * form fields are local state, and only until Save. */
function MachineCard({ machine }: { machine: MachineWithStats }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(machine.name);
  const [cleanIntervalJobs, setCleanIntervalJobs] = useState(String(machine.cleanIntervalJobs));
  const [notes, setNotes] = useState(machine.notes ?? "");
  const [pending, setPending] = useState(false);
  const archived = !!machine.archivedAt;

  if (editing) {
    return (
      <Card padding="16px 20px">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Machine name">
            <Input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <Field label="Clean every N jobs" hint="How many jobs strung before this machine should be cleaned again.">
            <Input type="number" min="1" value={cleanIntervalJobs} onChange={(e) => setCleanIntervalJobs(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <Field label="Notes">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="sm"
              disabled={pending || !name.trim()}
              onClick={async () => {
                setPending(true);
                await updateMachineAction(machine.id, { name, cleanIntervalJobs: Number.parseInt(cleanIntervalJobs, 10) || 1, notes: notes.trim() || null });
                setPending(false);
                setEditing(false);
                router.refresh();
              }}
            >
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="16px 20px">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>{machine.name}</span>
        {archived ? <Badge tone="neutral">Archived</Badge> : machine.needsCleaning ? <Badge tone="warning">Needs cleaning</Badge> : null}
        <button type="button" onClick={() => setEditing(true)} style={{ border: "none", background: "none", color: "var(--ink-400)", cursor: "pointer" }}>
          <Icon name="pencil" size={15} />
        </button>
        <Button
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={async () => {
            if (!archived && !confirm(`Archive "${machine.name}"? Existing jobs keep showing it was used.`)) return;
            setPending(true);
            await archiveMachineAction(machine.id, !archived);
            setPending(false);
            router.refresh();
          }}
        >
          {archived ? "Unarchive" : "Archive"}
        </Button>
      </div>

      <div className="ccard-stats" style={{ marginTop: 14, borderTop: "1px solid var(--ink-100)", paddingTop: 12 }}>
        <div className="ccard-stat">
          <span className="lab">Total jobs strung</span>
          <span className="num" style={{ fontSize: 15 }}>{machine.totalJobs}</span>
        </div>
        <div className="ccard-stat">
          <span className="lab">Since last clean</span>
          <span className="num" style={{ fontSize: 15, color: machine.needsCleaning ? "var(--signal-warning)" : undefined }}>
            {machine.jobsSinceClean} / {machine.cleanIntervalJobs}
          </span>
        </div>
        <div className="ccard-stat">
          <span className="lab">Last cleaned</span>
          <span className="num" style={{ fontSize: 15 }}>{formatDate(machine.lastCleanedAt)}</span>
        </div>
      </div>

      {machine.notes ? <p style={{ marginTop: 12, fontSize: 13.5, color: "var(--ink-600)" }}>{machine.notes}</p> : null}

      <Button
        size="sm"
        variant="secondary"
        style={{ marginTop: 14 }}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await markMachineCleanedAction(machine.id);
          setPending(false);
          router.refresh();
        }}
      >
        Mark cleaned today
      </Button>
    </Card>
  );
}

export function MachinesView({ machines }: { machines: MachineWithStats[] }) {
  const router = useRouter();
  const [addingMachine, setAddingMachine] = useState(false);
  const [newMachineName, setNewMachineName] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {machines.length === 0 && !addingMachine ? (
        <Card>
          <div className="rec-empty">No machines yet. Add one to start tracking jobs per machine.</div>
        </Card>
      ) : (
        machines.map((m) => <MachineCard key={m.id} machine={m} />)
      )}

      {addingMachine ? (
        <Card tone="sunken" padding="16px 20px" style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <Field label="New machine name" style={{ flex: 1 }}>
            <Input value={newMachineName} onChange={(e) => setNewMachineName(e.target.value)} style={{ width: "100%" }} />
          </Field>
          <Button
            size="sm"
            disabled={pending || !newMachineName.trim()}
            onClick={async () => {
              setPending(true);
              await createMachineAction(newMachineName);
              setPending(false);
              setNewMachineName("");
              setAddingMachine(false);
              router.refresh();
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAddingMachine(false)}>
            Cancel
          </Button>
        </Card>
      ) : (
        <Button variant="secondary" iconLeft="plus" onClick={() => setAddingMachine(true)} style={{ alignSelf: "flex-start" }}>
          Add machine
        </Button>
      )}
    </div>
  );
}
