// Plain types + initial state for the customer form. Kept out of
// src/app/customers/actions.ts because a "use server" module may only export
// async functions — a plain object/interface export breaks the build.
export interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface CustomerFormState {
  status: "idle" | "duplicate" | "error";
  message?: string;
  duplicate?: { id: string; name: string; code: string };
  values: CustomerFormValues;
}

export const emptyCustomerFormState: CustomerFormState = {
  status: "idle",
  values: { name: "", phone: "", email: "", notes: "" },
};
