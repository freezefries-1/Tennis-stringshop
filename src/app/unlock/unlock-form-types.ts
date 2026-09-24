// Plain types/initial-state kept out of actions.ts (a "use server" file may
// only export async functions) — same convention as job-form-types.ts etc.

export interface UnlockState {
  status: "idle" | "error";
  message?: string;
}

export const initialUnlockState: UnlockState = { status: "idle" };
