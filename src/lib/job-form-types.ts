export interface StringLineValues {
  customerSupplied: boolean;
  /** SportCraft Stock only, set by the string product picker — cleared
   * whenever customerSupplied flips true (brief §15). */
  stringProductId: string;
  brand: string;
  stringName: string;
  gauge: string;
  colour: string;
  tension: string;
  tensionUnit: "kg" | "lb";
  quantityUsed: string;
  usageUnit: "m" | "set";
}

/** Plain mirror of settings.ts's StringUsageDefaults — kept here (not
 * imported from src/lib/settings.ts) so this file, which Client Components
 * import directly, never pulls the DB-touching settings module into the
 * browser bundle. */
export interface StringUsageDefaultsView {
  fullBedUsageM: number;
  mainUsageM: number;
  crossUsageM: number;
}

export interface StockShortageView {
  role: "main" | "cross";
  productLabel: string;
  neededM: string;
  availableM: string;
  unit: "m" | "set";
}

export interface ServiceLineValues {
  serviceName: string;
  quantity: string;
  unitPrice: string; // dollars — converted to cents at submit
  notes: string;
}

export interface JobFormValues {
  customerId: string;
  customerRacketId: string;
  setupType: "full" | "hybrid";
  receivedOn: string; // yyyy-mm-dd
  dueOn: string;
  numberOfKnots: string;
  preStretchType: "none" | "manual" | "machine";
  preStretchPct: string;
  paymentStatus: "unpaid" | "partially_paid" | "paid";
  paymentMethod: string; // "" | paynow | cash | transfer | card | other
  discount: string; // dollars
  generalNotes: string;
  stringingNotes: string;
  main: StringLineValues;
  cross: StringLineValues;
  services: ServiceLineValues[];
}

export interface JobFormState {
  status: "idle" | "error" | "insufficient_stock";
  message?: string;
  shortages?: StockShortageView[];
  values: JobFormValues;
}

export const emptyStringLine: StringLineValues = {
  customerSupplied: false,
  stringProductId: "",
  brand: "",
  stringName: "",
  gauge: "",
  colour: "",
  tension: "",
  tensionUnit: "lb",
  quantityUsed: "",
  usageUnit: "m",
};

export function emptyJobFormValues(receivedOn: string): JobFormValues {
  return {
    customerId: "",
    customerRacketId: "",
    setupType: "full",
    receivedOn,
    dueOn: "",
    numberOfKnots: "",
    preStretchType: "none",
    preStretchPct: "",
    paymentStatus: "unpaid",
    paymentMethod: "",
    discount: "",
    generalNotes: "",
    stringingNotes: "",
    main: { ...emptyStringLine },
    cross: { ...emptyStringLine },
    services: [
      { serviceName: "String cost", quantity: "1", unitPrice: "", notes: "" },
      { serviceName: "Stringing labour", quantity: "1", unitPrice: "", notes: "" },
    ],
  };
}

export function emptyJobFormState(receivedOn: string): JobFormState {
  return { status: "idle", values: emptyJobFormValues(receivedOn) };
}

// Quantity supports halves (e.g. two "String cost · 0.5" lines for a
// hybrid job strung from one set split across main/cross) — see the
// Quantity input's step in services-editor.tsx.
export const COMMON_SERVICES = ["String cost", "Stringing labour", "Grip replacement", "Overgrip", "Racket customisation", "Grommet service"];

// Only a structural shape, not the real jobs.ts type — avoids importing the
// DB-touching module into this plain-types file (Client Components import
// this file directly, e.g. the "Repeat previous setup" button).
export interface RepeatableSetup {
  setupType: "full" | "hybrid";
  strings: {
    role: "main" | "cross";
    customerSupplied: boolean;
    stringProductId: string | null;
    brandSnapshot: string;
    stringNameSnapshot: string;
    gaugeSnapshot: string | null;
    colourSnapshot: string | null;
    tension: string;
    tensionUnit: "kg" | "lb";
    quantityUsed: string | null;
    usageUnit: "m" | "set" | null;
  }[];
  services: { serviceName: string; quantity: string; unitPriceCents: number; notes: string | null }[];
  discountCents: number;
  numberOfKnots: number | null;
  preStretchType: "none" | "manual" | "machine";
  preStretchPct: string | null;
  stringingNotes: string | null;
}

export function toStringLine(s: RepeatableSetup["strings"][number] | undefined): StringLineValues {
  if (!s) return { ...emptyStringLine };
  return {
    customerSupplied: s.customerSupplied,
    // The picker's "selected" chip renders straight off brand/stringName
    // below (see string-setup-fields.tsx) — no extra lookup needed to
    // restore a repeated/edited line's selection.
    stringProductId: s.stringProductId ?? "",
    brand: s.brandSnapshot,
    stringName: s.stringNameSnapshot,
    gauge: s.gaugeSnapshot ?? "",
    colour: s.colourSnapshot ?? "",
    tension: s.tension,
    tensionUnit: s.tensionUnit,
    quantityUsed: s.quantityUsed ?? "",
    usageUnit: s.usageUnit ?? "m",
  };
}

/** Copies a previous job's setup + suggested price into a (new or in-
 * progress) job form — never the job id, dates, status or payment status
 * (brief §26). Customer/racket/dates on `current` are left untouched. */
export function applyRepeatToValues(current: JobFormValues, setup: RepeatableSetup): JobFormValues {
  return {
    ...current,
    setupType: setup.setupType,
    main: toStringLine(setup.strings.find((s) => s.role === "main")),
    cross: toStringLine(setup.strings.find((s) => s.role === "cross")),
    numberOfKnots: setup.numberOfKnots != null ? String(setup.numberOfKnots) : "",
    preStretchType: setup.preStretchType,
    preStretchPct: setup.preStretchPct ?? "",
    stringingNotes: setup.stringingNotes ?? "",
    discount: setup.discountCents ? (setup.discountCents / 100).toFixed(2) : "",
    services: setup.services.length
      ? setup.services.map((s) => ({ serviceName: s.serviceName, quantity: s.quantity, unitPrice: (s.unitPriceCents / 100).toFixed(2), notes: s.notes ?? "" }))
      : current.services,
  };
}
